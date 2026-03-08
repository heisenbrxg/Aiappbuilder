import { WebContainer } from '@webcontainer/api';
import { lazyWebContainerManager } from './LazyWebContainerManager';

/**
 * Simple wrapper for lazy WebContainer initialization
 * Drop-in replacement for your current WebContainer usage
 */

// Current WebContainer state for backward compatibility
export let webcontainerContext = {
  loaded: false,
  container: null as WebContainer | null,
  error: null as Error | null,
};

/**
 * Initialize WebContainer lazily - call this when user opens a project
 * @param projectId Optional project identifier for multi-project support
 * @returns Promise that resolves to the WebContainer instance
 */
export async function initializeWebContainer(projectId?: string): Promise<WebContainer> {
  try {
    console.log('🚀 Initializing WebContainer lazily...');
    
    const container = await lazyWebContainerManager.getContainer(projectId);
    
    // Update legacy context for backward compatibility
    webcontainerContext = {
      loaded: true,
      container,
      error: null,
    };
    
    console.log('✅ WebContainer initialized successfully');
    return container;
    
  } catch (error) {
    console.error('❌ Failed to initialize WebContainer:', error);
    
    webcontainerContext = {
      loaded: false,
      container: null,
      error: error as Error,
    };
    
    throw error;
  }
}

/**
 * Get WebContainer if already initialized, or null if not
 * Non-blocking way to check for existing container
 */
export function getWebContainer(projectId?: string): WebContainer | null {
  const state = lazyWebContainerManager.getContainerState(projectId);
  return state.isReady ? webcontainerContext.container : null;
}

/**
 * Check if WebContainer is ready to use
 */
export function isWebContainerReady(projectId?: string): boolean {
  return lazyWebContainerManager.isContainerReady(projectId);
}

/**
 * Get current WebContainer loading state
 */
export function getWebContainerState(projectId?: string) {
  const state = lazyWebContainerManager.getContainerState(projectId);
  return {
    ...state,
    // Legacy compatibility
    loaded: state.isReady,
  };
}

/**
 * Preload WebContainer in background (for anticipated usage)
 * Safe to call - won't boot if device performance is low
 */
export function preloadWebContainer(projectId?: string): Promise<void> {
  if (!projectId) return Promise.resolve();
  return lazyWebContainerManager.preloadContainer(projectId);
}

/**
 * Release WebContainer and clean up resources
 */
export function releaseWebContainer(projectId?: string): Promise<void> {
  webcontainerContext = {
    loaded: false,
    container: null,
    error: null,
  };
  
  return lazyWebContainerManager.releaseContainer(projectId);
}

/**
 * Get performance metrics and container status
 */
export function getWebContainerMetrics() {
  return lazyWebContainerManager.getMetrics();
}

// Legacy export for backward compatibility with existing code
export const webcontainer = webcontainerContext;
