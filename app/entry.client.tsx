import { RemixBrowser } from '@remix-run/react';
import { startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';

// Force base font size to 16px using JavaScript (bulletproof fix for production)
if (typeof document !== 'undefined') {
  document.documentElement.style.fontSize = '16px';
}

// Suppress console messages that could expose app internals
// This runs in both development and production for security
if (typeof window !== 'undefined') {
  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  // Helper function to check if message should be suppressed
  const shouldSuppressMessage = (message: string) => {
    const suppressPatterns = [
      // React DevTools warnings
      'Download the React DevTools',
      'react-devtools',
      'https://reactjs.org/link/react-devtools',
      
      // WebContainer/StackBlitz warnings
      '[Contextify] [WARNING]',
      'running source code in new context',
      'was preloaded using link preload but not used',
      'fetch.worker',
      'w-credentialless-staticblitz.com',
      'staticblitz.com',
      'headless?coep=credentialless',
      
      // Memory usage warnings that expose internal details
      'High memory usage detected:',
      
      // Iframe sandbox warnings
      'An iframe which has both allow-scripts and allow-same-origin',
      'can escape its sandboxing',
      
      // Template/file operations (verbose)
      'Template Modern Web App:',
      'Retrieved',
      'files from',
      'After filtering',
      
      // Layout warnings
      'WARNING: Invalid layout total size',
      'Layout normalization will be applied',
      
      // Terminal health checks and locked files (verbose)
      'Terminal health check failed',
      'attempting recovery',
      'Cleared locked items cache',
      'No locked items found',
      'LockedFiles',
      'FilesStore',
      
      // Other potentially sensitive warnings
      'chunk-WQZD7YIK.js',
      'blitz.96435430.js',
      'blitz.1db57326.js',
      'LazyWebContainerManager.ts',
      
      // Browser extension injection errors (MetaMask, etc.)
      // Note: These are from BROWSER EXTENSIONS, not our code
      'MetaMask',
      'Failed to connect to MetaMask',
      'MetaMask extension not found',
      'window.ethereum',
      'inpage.js',
      'Cannot access \'e\' before initialization',
      'vendor-export',
      'readable-stream',
      
      // Generic patterns for obfuscated code warnings
      /\b[a-f0-9]{8}\b/i, // 8-character hex strings (hashes)
      /chunk-[A-Z0-9]+\.js/i, // chunk file patterns
      /\.[a-f0-9]{8}\./i, // file hash patterns
    ];
    
    return suppressPatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return message.includes(pattern);
      } else {
        return pattern.test(message);
      }
    });
  };

  console.log = (...args: any[]) => {
    const message = args.join(' ');
    if (shouldSuppressMessage(message)) {
      return; // Suppress these messages
    }
    originalConsoleLog.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (shouldSuppressMessage(message)) {
      return; // Suppress these warnings
    }
    originalConsoleWarn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (shouldSuppressMessage(message)) {
      return; // Suppress these errors
    }
    originalConsoleError.apply(console, args);
  };

  // Also intercept browser warnings that appear in the console
  // This catches warnings that bypass console methods
  if ('addEventListener' in window) {
    window.addEventListener('error', (event) => {
      const message = event.message || '';
      if (shouldSuppressMessage(message)) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }, true);

    window.addEventListener('unhandledrejection', (event) => {
      const message = String(event.reason || '');
      if (shouldSuppressMessage(message)) {
        event.preventDefault();
        return false;
      }
    });
  }
}

startTransition(() => {
  hydrateRoot(document.getElementById('root')!, <RemixBrowser />);
});
