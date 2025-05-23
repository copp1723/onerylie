/**
 * Cache Utility
 * 
 * This module provides a simple but effective in-memory caching system with
 * support for TTL (time-to-live), automatic invalidation, and namespacing.
 * 
 * For production environments, this could be replaced with Redis or another
 * distributed cache system for better horizontal scaling.
 */

interface CacheItem<T> {
  data: T;
  expiry: number;
}

interface CacheConfig {
  defaultTtl: number;
  maxSize: number;
  cleanupInterval: number;
}

class CacheStore {
  private cache: Map<string, CacheItem<any>>;
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private hitCount: number = 0;
  private missCount: number = 0;
  
  constructor(config?: Partial<CacheConfig>) {
    this.cache = new Map();
    this.config = {
      defaultTtl: 60 * 1000, // 1 minute default TTL
      maxSize: 1000, // Maximum items to store
      cleanupInterval: 5 * 60 * 1000, // Cleanup every 5 minutes
      ...config
    };
    
    this.startCleanupTimer();
  }
  
  /**
   * Start the automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
    
    // Ensure the timer doesn't prevent the process from exiting
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }
  
  /**
   * Clean up expired cache entries
   */
  public cleanup(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry <= now) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Cache cleanup: removed ${removedCount} expired items`);
    }
  }
  
  /**
   * Get an item from cache
   * 
   * @param key Cache key
   * @param namespace Optional namespace to avoid key collisions
   * @returns The cached value or null if not found or expired
   */
  public get<T>(key: string, namespace?: string): T | null {
    const cacheKey = namespace ? `${namespace}:${key}` : key;
    const item = this.cache.get(cacheKey);
    
    if (!item) {
      this.missCount++;
      return null;
    }
    
    const now = Date.now();
    if (item.expiry <= now) {
      this.cache.delete(cacheKey);
      this.missCount++;
      return null;
    }
    
    this.hitCount++;
    return item.data as T;
  }
  
  /**
   * Set an item in the cache
   * 
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time-to-live in milliseconds
   * @param namespace Optional namespace to avoid key collisions
   */
  public set<T>(key: string, data: T, ttl?: number, namespace?: string): void {
    const cacheKey = namespace ? `${namespace}:${key}` : key;
    
    // Enforce cache size limit
    if (this.cache.size >= this.config.maxSize) {
      // Simple eviction strategy: remove the first item (oldest added)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    const expiry = Date.now() + (ttl || this.config.defaultTtl);
    
    this.cache.set(cacheKey, {
      data,
      expiry
    });
  }
  
  /**
   * Remove an item from the cache
   * 
   * @param key Cache key
   * @param namespace Optional namespace
   * @returns true if the item was removed, false if it wasn't found
   */
  public delete(key: string, namespace?: string): boolean {
    const cacheKey = namespace ? `${namespace}:${key}` : key;
    return this.cache.delete(cacheKey);
  }
  
  /**
   * Remove all items with a given namespace prefix
   * 
   * @param namespace Namespace to clear
   * @returns Number of items removed
   */
  public clearNamespace(namespace: string): number {
    const prefix = `${namespace}:`;
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Clear the entire cache
   */
  public clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  public getStats() {
    return {
      size: this.cache.size,
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: this.hitCount + this.missCount > 0 
        ? (this.hitCount / (this.hitCount + this.missCount)) * 100 
        : 0
    };
  }
  
  /**
   * Stop the cleanup timer
   */
  public stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Create a default instance
const defaultCache = new CacheStore({
  defaultTtl: process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 60 * 1000, // 5 minutes in production, 1 minute in dev
  maxSize: process.env.NODE_ENV === 'production' ? 5000 : 1000 // More cache in production
});

// Export the cache functions directly for ease of use
export const getFromCache = <T>(key: string, namespace?: string): T | null => {
  return defaultCache.get<T>(key, namespace);
};

export const setInCache = <T>(key: string, data: T, ttl?: number, namespace?: string): void => {
  defaultCache.set<T>(key, data, ttl, namespace);
};

export const removeFromCache = (key: string, namespace?: string): boolean => {
  return defaultCache.delete(key, namespace);
};

export const clearNamespaceCache = (namespace: string): number => {
  return defaultCache.clearNamespace(namespace);
};

export const clearAllCache = (): void => {
  defaultCache.clear();
};

export const getCacheStats = () => {
  return defaultCache.getStats();
};

// Export the cache instance as well for more control
export const cacheStore = defaultCache;

// Export a function to shut down the cache system
export const shutdownCache = (): void => {
  defaultCache.stopCleanupTimer();
};

// Add to graceful shutdown process
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    shutdownCache();
  });
  
  process.on('SIGINT', () => {
    shutdownCache();
  });
}