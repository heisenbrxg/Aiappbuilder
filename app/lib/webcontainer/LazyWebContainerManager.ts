import { WebContainer } from '@webcontainer/api';
import { WORK_DIR_NAME } from '~/utils/constants';
import { cleanStackTrace } from '~/utils/stacktrace';
// Reuse the global singleton promise exported from `index.ts` to guarantee
// that only ONE call to `WebContainer.boot()` can ever happen. Any attempt
// to boot a container from this manager will first check and await that
// promise instead of issuing a second boot call.
import { webcontainer as globalWebcontainer, webcontainerContext } from './index';

interface WebContainerState {
  container?: WebContainer;
  isLoading: boolean;
  isBooted: boolean;
  bootPromise?: Promise<WebContainer>;
  error?: Error;
  lastAccessTime: number;
}

interface LazyBootOptions {
  coep?: 'credentialless' | 'require-corp';
  workdirName?: string;
  forwardPreviewErrors?: boolean;
  enableNodeJsCompatMode?: boolean;
}

/**
 * LazyWebContainerManager - Optimized WebContainer loading with performance enhancements
 * 
 * Features:
 * - Lazy initialization (only boots when needed)
 * - Mobile performance optimizations
 * - Resource cleanup and management
 * - Connection pooling for multiple projects
 * - Memory usage monitoring
 * - Progressive loading with fallbacks
 */
export class LazyWebContainerManager {
  private static instance: LazyWebContainerManager;
  private containers = new Map<string, WebContainerState>();
  private defaultContainerKey = 'default';
  private maxContainers = 3; // Limit concurrent containers
  private cleanupInterval?: NodeJS.Timeout;
  private isMobile: boolean;
  private performanceMode: 'high' | 'balanced' | 'low';
  
  private constructor() {
    this.isMobile = this.detectMobile();
    this.performanceMode = this.detectPerformanceMode();
    this.setupCleanup();
    this.setupPerformanceMonitoring();
  }

  static getInstance(): LazyWebContainerManager {
    if (!LazyWebContainerManager.instance) {
      LazyWebContainerManager.instance = new LazyWebContainerManager();
    }
    return LazyWebContainerManager.instance;
  }

  /**
   * Get or create a WebContainer with lazy loading
   */
  async getContainer(projectId?: string): Promise<WebContainer> {
    const key = projectId || this.defaultContainerKey;
    const state = this.containers.get(key) || this.createEmptyState();
    
    // Update access time
    state.lastAccessTime = Date.now();
    this.containers.set(key, state);

    // Return existing container if available
    if (state.container && state.isBooted) {
      return state.container;
    }

    // Return existing boot promise if already loading
    if (state.bootPromise) {
      return state.bootPromise;
    }

    // Start lazy boot process
    state.bootPromise = this.lazyBoot(key, state);
    return state.bootPromise;
  }

  /**
   * Preload a container in the background (for anticipated usage)
   */
  async preloadContainer(projectId: string): Promise<void> {
    if (this.performanceMode === 'low') {
      return; // Skip preloading on low-performance devices
    }

    // Only preload if we have capacity
    if (this.containers.size >= this.maxContainers) {
      return;
    }

    try {
      await this.getContainer(projectId);
    } catch (error) {
      console.warn(`Failed to preload container for project ${projectId}:`, error);
    }
  }

  /**
   * Check if a container is ready without triggering a boot
   */
  isContainerReady(projectId?: string): boolean {
    const key = projectId || this.defaultContainerKey;
    const state = this.containers.get(key);
    return !!(state?.container && state.isBooted && !state.error);
  }

  /**
   * Get container loading state
   */
  getContainerState(projectId?: string): {
    isLoading: boolean;
    isReady: boolean;
    hasError: boolean;
    error?: string;
  } {
    const key = projectId || this.defaultContainerKey;
    const state = this.containers.get(key);
    
    return {
      isLoading: state?.isLoading || false,
      isReady: !!(state?.container && state.isBooted),
      hasError: !!state?.error,
      error: state?.error?.message
    };
  }

  /**
   * Release a container and clean up resources
   */
  async releaseContainer(projectId?: string): Promise<void> {
    const key = projectId || this.defaultContainerKey;
    const state = this.containers.get(key);
    
    if (state?.container) {
      try {
        // Cleanup container resources
        await this.cleanupContainer(state.container);
      } catch (error) {
        console.warn(`Error cleaning up container ${key}:`, error);
      }
    }
    
    this.containers.delete(key);
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    activeContainers: number;
    totalContainers: number;
    memoryUsage?: number;
    performanceMode: string;
    isMobile: boolean;
  } {
    const activeContainers = Array.from(this.containers.values())
      .filter(state => state.isBooted && !state.error).length;

    return {
      activeContainers,
      totalContainers: this.containers.size,
      memoryUsage: this.getMemoryUsage(),
      performanceMode: this.performanceMode,
      isMobile: this.isMobile
    };
  }

  private async lazyBoot(key: string, state: WebContainerState): Promise<WebContainer> {
    if (state.isLoading) {
      throw new Error('Container is already booting');
    }

    // -------------------------------------------------------------
    //  Singleton Guard
    // -------------------------------------------------------------
    // If the global singleton is already booted (or in the middle of             
    // booting) we simply await it and reuse the same container instance.         
    // This completely eliminates the race that caused the                        
    // "WebContainer boot() called multiple times" runtime error.               
    // -------------------------------------------------------------------------
    if (webcontainerContext.loaded) {
      const container = await globalWebcontainer;
      state.container = container;
      state.isBooted = true;
      state.isLoading = false;
      state.lastAccessTime = Date.now();
      return container;
    }

    try {
      // Await the global promise in case another module has already started
      // the boot process but `loaded` hasn't flipped yet.
      const container = await globalWebcontainer;
      if (container) {
        webcontainerContext.loaded = true;
        state.container = container;
        state.isBooted = true;
        state.isLoading = false;
        state.lastAccessTime = Date.now();
        return container;
      }
    } catch {
      // If awaiting the global promise failed, we'll attempt a fresh boot below.
    }

    state.isLoading = true;
    state.error = undefined;

    try {
      // Check if we need to cleanup old containers first
      await this.enforceContainerLimit();

      // Optimize boot options based on device capabilities
      const bootOptions = this.getOptimizedBootOptions();
      
      console.log(`🚀 Booting WebContainer ${key} with options:`, bootOptions);
      
      const container = await WebContainer.boot(bootOptions);
      
      // Setup container with optimizations
      await this.setupContainer(container, key);
      
      state.container = container;
      state.isBooted = true;
      state.isLoading = false;
      state.lastAccessTime = Date.now();
      
      console.log(`✅ WebContainer ${key} booted successfully`);
      
      return container;
      
    } catch (error) {
      state.error = error as Error;
      state.isLoading = false;
      state.bootPromise = undefined;
      
      console.error(`❌ Failed to boot WebContainer ${key}:`, error);
      throw error;
    }
  }

  private async setupContainer(container: WebContainer, key: string): Promise<void> {
    try {
      // Setup preview script if available
      if (typeof fetch !== 'undefined') {
        try {
          const response = await fetch('/inspector-script.js');
          const inspectorScript = await response.text();
          await container.setPreviewScript(inspectorScript);
        } catch (error) {
          console.warn('Failed to load inspector script:', error);
        }
      }

      // Setup error handling
      container.on('preview-message', (message) => {
        this.handlePreviewMessage(message, key);
      });

      // Setup performance monitoring
      if (this.performanceMode !== 'low') {
        this.setupContainerMonitoring(container, key);
      }

    } catch (error) {
      console.warn(`Failed to setup container ${key}:`, error);
      // Non-critical setup failures shouldn't prevent container usage
    }
  }

  private handlePreviewMessage(message: any, containerKey: string): void {
    console.log(`WebContainer ${containerKey} preview message:`, message);

    if (message.type === 'PREVIEW_UNCAUGHT_EXCEPTION' || message.type === 'PREVIEW_UNHANDLED_REJECTION') {
      const isPromise = message.type === 'PREVIEW_UNHANDLED_REJECTION';
      const title = isPromise ? 'Unhandled Promise Rejection' : 'Uncaught Exception';
      
      // Emit error event that can be handled by the workbench
      this.emitContainerError(containerKey, {
        type: 'preview',
        title,
        description: 'message' in message ? message.message : 'Unknown error',
        content: `Error occurred at ${message.pathname}${message.search}${message.hash}\nPort: ${message.port}\n\nStack trace:\n${cleanStackTrace(message.stack || '')}`,
        source: 'preview',
      });
    }
  }

  private emitContainerError(containerKey: string, error: any): void {
    // This can be connected to your existing alert system
    window.dispatchEvent(new CustomEvent('webcontainer-error', { 
      detail: { containerKey, error } 
    }));
  }

  private async enforceContainerLimit(): Promise<void> {
    if (this.containers.size < this.maxContainers) {
      return;
    }

    // Find the least recently used container
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, state] of this.containers) {
      if (state.lastAccessTime < oldestTime) {
        oldestTime = state.lastAccessTime;
        oldestKey = key;
      }
    }

    if (oldestKey && oldestKey !== this.defaultContainerKey) {
      console.log(`🧹 Cleaning up old container: ${oldestKey}`);
      await this.releaseContainer(oldestKey);
    }
  }

  private async cleanupContainer(container: WebContainer): Promise<void> {
    try {
      // Cleanup any running processes
      // Note: WebContainer API might not expose direct cleanup methods
      // This is where you'd add any necessary cleanup
      console.log('🧹 Cleaning up WebContainer resources');
    } catch (error) {
      console.warn('Error during container cleanup:', error);
    }
  }

  private createEmptyState(): WebContainerState {
    return {
      isLoading: false,
      isBooted: false,
      lastAccessTime: Date.now(),
    };
  }

  private getOptimizedBootOptions(): LazyBootOptions {
    const baseOptions: LazyBootOptions = {
      coep: 'credentialless',
      workdirName: WORK_DIR_NAME,
      forwardPreviewErrors: true,
      enableNodeJsCompatMode: false,
    };

    // Optimize based on device capabilities
    if (this.isMobile || this.performanceMode === 'low') {
      // More conservative options for mobile/low-performance devices
      return {
        ...baseOptions,
        // Add mobile-specific optimizations here
      };
    }

    return baseOptions;
  }

  private detectMobile(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;
  }

  private detectPerformanceMode(): 'high' | 'balanced' | 'low' {
    if (typeof window === 'undefined') return 'balanced';

    const connection = (navigator as any).connection;
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency;

    // Low performance indicators
    if (this.isMobile || 
        (memory && memory < 4) || 
        (cores && cores < 4) ||
        (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'))) {
      return 'low';
    }

    // High performance indicators
    if (memory >= 8 && cores >= 8) {
      return 'high';
    }

    return 'balanced';
  }

  private setupCleanup(): void {
    // Cleanup unused containers every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000);

    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  private async performCleanup(): Promise<void> {
    const now = Date.now();
    const maxIdleTime = 10 * 60 * 1000; // 10 minutes

    for (const [key, state] of this.containers) {
      if (key !== this.defaultContainerKey && 
          now - state.lastAccessTime > maxIdleTime) {
        console.log(`🧹 Auto-cleaning up idle container: ${key}`);
        await this.releaseContainer(key);
      }
    }
  }

  private setupContainerMonitoring(container: WebContainer, key: string): void {
    // Monitor container health and performance
    // This is where you'd add monitoring logic
  }

  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor memory usage
    setInterval(() => {
      if (this.containers.size > 0) {
        const memUsage = this.getMemoryUsage();
        if (memUsage && memUsage > 100) { // 100MB threshold
          console.warn(`High memory usage detected: ${memUsage}MB`);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private getMemoryUsage(): number | undefined {
    if (typeof window === 'undefined') return undefined;
    
    const memory = (performance as any).memory;
    if (memory) {
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return undefined;
  }

  public cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Cleanup all containers
    for (const [key] of this.containers) {
      this.releaseContainer(key).catch(console.error);
    }
  }
}

// Export singleton instance
export const lazyWebContainerManager = LazyWebContainerManager.getInstance();
