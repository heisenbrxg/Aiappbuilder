/**
 * Cache Management Utility
 * Handles browser caching issues and provides cache invalidation strategies
 */

export class CacheManager {
  private static instance: CacheManager;
  private cacheVersion: string;

  private constructor() {
    this.cacheVersion = this.generateCacheVersion();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private generateCacheVersion(): string {
    // Use build time, commit hash, or timestamp for cache versioning
    const buildInfo = {
      timestamp: Date.now(),
      commitHash: typeof window !== 'undefined' ? 
        (window as any).__COMMIT_HASH || 'dev' : 'dev',
      version: typeof window !== 'undefined' ? 
        (window as any).__APP_VERSION || '1.0.0' : '1.0.0'
    };
    
    return btoa(JSON.stringify(buildInfo)).slice(0, 8);
  }

  /**
   * Clear all browser caches
   */
  public async clearAllCaches(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear IndexedDB
      await this.clearIndexedDB();
      
      // Clear Service Worker caches
      await this.clearServiceWorkerCaches();
      
      console.log('All caches cleared successfully');
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }

  /**
   * Clear IndexedDB databases
   */
  private async clearIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) return;

    try {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map(db => {
          if (db.name) {
            return new Promise<void>((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name!);
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => reject(deleteReq.error);
            });
          }
        })
      );
    } catch (error) {
      console.warn('Could not clear IndexedDB:', error);
    }
  }

  /**
   * Clear Service Worker caches
   */
  private async clearServiceWorkerCaches(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    } catch (error) {
      console.warn('Could not clear Service Worker caches:', error);
    }
  }

  /**
   * Add cache-busting parameters to URLs
   */
  public addCacheBuster(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${this.cacheVersion}&t=${Date.now()}`;
  }

  /**
   * Force reload the page with cache bypass
   */
  public forceReload(): void {
    if (typeof window === 'undefined') return;
    
    // Use location.reload(true) to bypass cache
    window.location.reload();
  }

  /**
   * Check if the app version has changed and clear cache if needed
   */
  public async checkVersionAndClearCache(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const storedVersion = localStorage.getItem('app_cache_version');
    const currentVersion = this.cacheVersion;

    if (storedVersion && storedVersion !== currentVersion) {
      console.log('App version changed, clearing caches...');
      await this.clearAllCaches();
      localStorage.setItem('app_cache_version', currentVersion);
      return true;
    }

    if (!storedVersion) {
      localStorage.setItem('app_cache_version', currentVersion);
    }

    return false;
  }

  /**
   * Set cache headers for responses
   */
  public static getCacheHeaders(maxAge: number = 3600): Record<string, string> {
    return {
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
      'ETag': `"${Date.now()}"`,
      'Vary': 'Accept-Encoding',
    };
  }

  /**
   * Set no-cache headers for responses
   */
  public static getNoCacheHeaders(): Record<string, string> {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
  }

  /**
   * Clear specific cache by key pattern
   */
  public clearCacheByPattern(pattern: string): void {
    if (typeof window === 'undefined') return;

    // Clear localStorage items matching pattern
    Object.keys(localStorage).forEach(key => {
      if (key.includes(pattern)) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage items matching pattern
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes(pattern)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    localStorageSize: number;
    sessionStorageSize: number;
    localStorageKeys: number;
    sessionStorageKeys: number;
  } {
    if (typeof window === 'undefined') {
      return {
        localStorageSize: 0,
        sessionStorageSize: 0,
        localStorageKeys: 0,
        sessionStorageKeys: 0,
      };
    }

    const getStorageSize = (storage: Storage): number => {
      let size = 0;
      for (const key in storage) {
        if (storage.hasOwnProperty(key)) {
          size += storage[key].length + key.length;
        }
      }
      return size;
    };

    return {
      localStorageSize: getStorageSize(localStorage),
      sessionStorageSize: getStorageSize(sessionStorage),
      localStorageKeys: localStorage.length,
      sessionStorageKeys: sessionStorage.length,
    };
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();
