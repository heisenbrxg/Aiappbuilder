import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '~/utils/constants';
import { cleanStackTrace } from '~/utils/stacktrace';
import { createBoltPreviewError } from '~/types/errors';

interface WebContainerContext {
  loaded: boolean;
}

export const webcontainerContext: WebContainerContext = import.meta.hot?.data.webcontainerContext ?? {
  loaded: false,
};

if (import.meta.hot) {
  import.meta.hot.data.webcontainerContext = webcontainerContext;
}

export let webcontainer: Promise<WebContainer> = new Promise(() => {
  // noop for ssr
});

if (!import.meta.env.SSR) {
  webcontainer =
    import.meta.hot?.data.webcontainer ??
    Promise.resolve()
      .then(() => {
        return WebContainer.boot({
          coep: 'credentialless',
          workdirName: WORK_DIR_NAME,
          forwardPreviewErrors: true, // Enable error forwarding from iframes
        });
      })
      .then(async (webcontainer) => {
        webcontainerContext.loaded = true;

        const { workbenchStore } = await import('~/lib/stores/workbench');

        // Load and set inspector script with error handling
        try {
          const response = await fetch('/inspector-script.js');
          if (!response.ok) {
            throw new Error(`Failed to fetch inspector script: ${response.status} ${response.statusText}`);
          }
          const inspectorScript = await response.text();
          await webcontainer.setPreviewScript(inspectorScript, { type: 'module' });
        } catch (error) {
          console.error('❌ CRITICAL: Inspector script failed to load:', error);
          
          // Alert user that preview error detection is disabled
          workbenchStore.actionAlert.set({
            type: 'error',
            title: 'Preview Error Detection Disabled',
            description: 'Inspector script failed to load. Runtime errors in the preview may not be detected automatically.',
            content: `Error: ${error instanceof Error ? error.message : String(error)}\n\nPreview will still work, but errors won't trigger automatic fix suggestions.`,
            source: 'preview',
          });
        }


        // ========== ENHANCED ERROR DEBOUNCING & DEDUPLICATION ==========
        const MAX_ERRORS_PER_BATCH = 10;
        const DEBOUNCE_WINDOW_MS = 500; // Increased from 300ms
        const ERROR_DEDUP_WINDOW_MS = 5000; // 5 seconds deduplication window
        
        let errorDebounceTimeout: NodeJS.Timeout | null = null;
        let pendingErrors: Array<{
          subType: string;
          title: string;
          message: string;
          stack?: string;
          pathname?: string;
          port?: string | number;
          timestamp: number;
          hash: string; // For deduplication
        }> = [];
        let lastDisplayedErrors = new Map<string, number>(); // hash -> timestamp

        // Create error hash for deduplication
        const createErrorHash = (title: string, message: string, stack?: string): string => {
          // Use first line of stack for better deduplication
          const stackLine = stack?.split('\n')[0] || '';
          return `${title}:${message}:${stackLine}`;
        };

        // Clean up old deduplication entries
        const cleanupDeduplicationMap = () => {
          const now = Date.now();
          for (const [hash, timestamp] of lastDisplayedErrors.entries()) {
            if (now - timestamp > ERROR_DEDUP_WINDOW_MS * 2) {
              lastDisplayedErrors.delete(hash);
            }
          }
        };

        // Display error batch
        const displayErrorBatch = () => {
          const errorCount = pendingErrors.length;
          
          if (errorCount === 0) {
            return;
          }
          
          if (errorCount === 1) {
            // Single error
            const error = pendingErrors[0];
            const boltPreviewError = createBoltPreviewError({
              source: 'preview-iframe',
              subType: error.subType,
              message: error.message,
              raw: JSON.stringify({ type: error.subType, message: error.message }),
              stack: error.stack,
              previewUrl: error.pathname ? `${error.pathname}` : undefined,
            });
            
            workbenchStore.actionAlert.set({
              type: 'preview',
              title: error.title,
              description: error.message,
              content: `Error occurred at ${error.pathname || 'unknown'}
Port: ${error.port || 'unknown'}

Stack trace:
${boltPreviewError.stack || 'No stack trace available'}`,
              source: 'preview',
            });
          } else {
            // Multiple errors - deduplicate by hash
            const uniqueErrors = Array.from(
              new Map(pendingErrors.map(e => [e.hash, e])).values()
            );
            
            const combinedDescription = uniqueErrors
              .map((e, i) => `${i + 1}. ${e.title}: ${e.message}`)
              .join('\n');
            
            const combinedContent = uniqueErrors
              .map((e, i) => `Error ${i + 1}: ${e.title}
Location: ${e.pathname || 'unknown'}
Stack:
${e.stack || 'No stack trace'}
`)
              .join('\n---\n\n');
            
            workbenchStore.actionAlert.set({
              type: 'preview',
              title: `${uniqueErrors.length} Unique Error${uniqueErrors.length > 1 ? 's' : ''} Detected`,
              description: combinedDescription,
              content: `Multiple errors occurred:\n\n${combinedContent}`,
              source: 'preview',
            });
          }
          
          // Reset
          pendingErrors = [];
          errorDebounceTimeout = null;
          
          // Clean up old deduplication entries
          cleanupDeduplicationMap();
        };

        // Listen for preview errors
        webcontainer.on('preview-message', (message) => {
          console.log('WebContainer preview message:', message);

          // Helper function to normalize messages and debounce alerts
          const forwardPreviewError = (subType: string, title: string, errorMessage: string, stack?: string) => {
            // Create error hash for deduplication
            const errorHash = createErrorHash(title, errorMessage, stack);
            
            // Check if duplicate within last 5 seconds
            const lastSeen = lastDisplayedErrors.get(errorHash);
            if (lastSeen && Date.now() - lastSeen < ERROR_DEDUP_WINDOW_MS) {
              console.log('Skipping duplicate error:', title);
              return;
            }
            
            // Enforce max errors per batch to prevent memory leaks
            if (pendingErrors.length >= MAX_ERRORS_PER_BATCH) {
              console.warn(`Max error limit reached (${MAX_ERRORS_PER_BATCH}), forcing display`);
              
              // Force display current batch
              if (errorDebounceTimeout) {
                clearTimeout(errorDebounceTimeout);
                displayErrorBatch();
              }
              return;
            }
            
            // Collect error
            pendingErrors.push({
              subType,
              title,
              message: errorMessage,
              stack: stack ? cleanStackTrace(stack) : undefined,
              pathname: message.pathname,
              port: message.port,
              timestamp: Date.now(),
              hash: errorHash,
            });
            
            // Update last seen for deduplication
            lastDisplayedErrors.set(errorHash, Date.now());
            
            // Clear existing timeout
            if (errorDebounceTimeout) {
              clearTimeout(errorDebounceTimeout);
            }
            
            // Wait for more errors
            errorDebounceTimeout = setTimeout(() => {
              displayErrorBatch();
            }, DEBOUNCE_WINDOW_MS);
          };

          // Handle all error message types
          switch (message.type as any) {
            case 'PREVIEW_UNCAUGHT_EXCEPTION':
              forwardPreviewError(
                'uncaught-exception',
                'Uncaught Exception',
                'message' in message ? message.message : 'Unknown uncaught exception',
                message.stack
              );
              break;

            case 'PREVIEW_UNHANDLED_REJECTION':
              forwardPreviewError(
                'unhandled-rejection',
                'Unhandled Promise Rejection',
                'message' in message ? message.message : 'Unknown unhandled promise rejection',
                message.stack
              );
              break;

            case 'PREVIEW_ERROR':
              forwardPreviewError(
                'general-error',
                'Preview Error', 
                'message' in message ? message.message : 'Unknown preview error',
                message.stack
              );
              break;

            case 'PREVIEW_HMR_ERROR':
              forwardPreviewError(
                'hmr-error',
                'Hot Module Reload Error',
                'message' in message ? message.message : 'HMR update failed',
                message.stack
              );
              break;

            case 'PREVIEW_CONSOLE_ERROR':
              forwardPreviewError(
                'console-error',
                'Console Error',
                'message' in message ? message.message : 'Console error detected',
                message.stack
              );
              break;

            case 'PREVIEW_VITE_ERROR':
              forwardPreviewError(
                'vite-error',
                'Vite Error',
                'message' in message ? message.message : 'Vite build or runtime error',
                message.stack
              );
              break;

            // Handle new inspector script message types
            case 'JS_ERROR':
              if ((message as any).version) { // Only handle versioned messages to avoid duplicates
                forwardPreviewError(
                  'js-error',
                  'JavaScript Error',
                  (message as any).error?.message || 'JavaScript runtime error',
                  (message as any).error?.stack
                );
              }
              break;

            case 'PROMISE_REJECTION':
              if ((message as any).version) {
                forwardPreviewError(
                  'promise-rejection',
                  'Unhandled Promise Rejection',
                  (message as any).reason || 'Promise rejection',
                  (message as any).stack
                );
              }
              break;

            case 'CONSOLE_ERROR':
              if ((message as any).version) {
                const errorMessage = (message as any).arguments?.map((arg: any) => 
                  typeof arg === 'object' && arg.message ? arg.message : String(arg)
                ).join(' ') || 'Console error';
                forwardPreviewError(
                  'console-error',
                  'Console Error',
                  errorMessage,
                  (message as any).arguments?.find((arg: any) => typeof arg === 'object' && arg.stack)?.stack
                );
              }
              break;

            case 'VITE_HMR_ERROR':
              if ((message as any).version) {
                forwardPreviewError(
                  'vite-hmr-error',
                  'Vite HMR Error',
                  (message as any).message || 'Vite HMR update failed',
                  (message as any).stack
                );
              }
              break;

            // 🚀 NEW: Network error detection
            case 'NETWORK_ERROR':
              if ((message as any).version) {
                const networkInfo = (message as any).network;
                const errorDetails = networkInfo?.status 
                  ? `HTTP ${networkInfo.status}: ${networkInfo.statusText || 'Error'}`
                  : networkInfo?.reason || 'Network request failed';
                
                forwardPreviewError(
                  'network-error',
                  'Network Request Failed',
                  networkInfo?.message || errorDetails,
                  networkInfo?.stack
                );
              }
              break;

            // 🚀 NEW: Resource loading error detection
            case 'RESOURCE_ERROR':
              if ((message as any).version) {
                const resource = (message as any).resource;
                const resourceType = resource?.type || 'resource';
                const resourceUrl = resource?.url || 'unknown';
                
                forwardPreviewError(
                  'resource-error',
                  `Failed to Load ${resourceType.toUpperCase()}`,
                  resource?.message || `Could not load ${resourceType}: ${resourceUrl}`,
                  undefined // Resources don't have stack traces
                );
              }
              break;

            default:
              // Log unhandled message types for debugging
              console.log('Unhandled preview message type:', message.type, message);
              break;
          }
        });

        return webcontainer;
      });

  if (import.meta.hot) {
    import.meta.hot.data.webcontainer = webcontainer;
  }
}
