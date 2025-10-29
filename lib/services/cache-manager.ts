interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

interface CacheMetrics {
  hits: number
  misses: number
  totalRequests: number
  cacheSize: number
  lastCleanup: number
}

export class CacheManager {
  private memoryCache: Map<string, CacheEntry>
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds
  private readonly MAX_CACHE_SIZE = 100
  private readonly CLEANUP_INTERVAL = 10 * 60 * 1000 // 10 minutes
  private metrics: CacheMetrics
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor() {
    this.memoryCache = new Map()
    this.metrics = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      cacheSize: 0,
      lastCleanup: Date.now()
    }
    
    // Start periodic cleanup
    this.startPeriodicCleanup()
  }

  get<T>(key: string): T | null {
    this.metrics.totalRequests++
    
    const entry = this.memoryCache.get(key)
    
    if (!entry) {
      this.metrics.misses++
      return null
    }
    
    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.memoryCache.delete(key)
      this.updateCacheSize()
      this.metrics.misses++
      return null
    }
    
    this.metrics.hits++
    return entry.data
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const actualTtl = ttl || this.CACHE_TTL
    
    // Check cache size limit before adding
    if (this.memoryCache.size >= this.MAX_CACHE_SIZE && !this.memoryCache.has(key)) {
      this.evictOldestEntries(1)
    }
    
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: actualTtl,
      key
    }
    
    this.memoryCache.set(key, entry)
    this.updateCacheSize()
  }

  invalidate(pattern: string): void {
    const keysToDelete: string[] = []
    
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => {
      this.memoryCache.delete(key)
    })
    
    this.updateCacheSize()
  }

  generateKey(request: any): string {
    // Create a deterministic key from the request object
    const sortedRequest = this.sortObjectKeys(request)
    const keyString = JSON.stringify(sortedRequest)
    
    // Simple hash function for shorter keys
    let hash = 0
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return `cache_${Math.abs(hash).toString(36)}`
  }

  cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        expiredKeys.push(key)
      }
    }
    
    expiredKeys.forEach(key => {
      this.memoryCache.delete(key)
    })
    
    this.updateCacheSize()
    this.metrics.lastCleanup = now
    
    console.log(`Cache cleanup completed. Removed ${expiredKeys.length} expired entries.`)
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  getCacheHitRatio(): number {
    if (this.metrics.totalRequests === 0) return 0
    return this.metrics.hits / this.metrics.totalRequests
  }

  clear(): void {
    this.memoryCache.clear()
    this.updateCacheSize()
    this.metrics = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      cacheSize: 0,
      lastCleanup: Date.now()
    }
  }

  getCacheInfo(): {
    size: number
    maxSize: number
    hitRatio: number
    metrics: CacheMetrics
  } {
    return {
      size: this.memoryCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRatio: this.getCacheHitRatio(),
      metrics: this.getMetrics()
    }
  }

  // Get all cache keys (for debugging)
  getCacheKeys(): string[] {
    return Array.from(this.memoryCache.keys())
  }

  // Check if a key exists in cache
  has(key: string): boolean {
    const entry = this.memoryCache.get(key)
    if (!entry) return false
    
    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.memoryCache.delete(key)
      this.updateCacheSize()
      return false
    }
    
    return true
  }

  // Get cache entry with metadata
  getWithMetadata<T>(key: string): { data: T; metadata: { timestamp: number; ttl: number; age: number } } | null {
    const entry = this.memoryCache.get(key)
    
    if (!entry) return null
    
    const now = Date.now()
    if (now > entry.timestamp + entry.ttl) {
      this.memoryCache.delete(key)
      this.updateCacheSize()
      return null
    }
    
    return {
      data: entry.data,
      metadata: {
        timestamp: entry.timestamp,
        ttl: entry.ttl,
        age: now - entry.timestamp
      }
    }
  }

  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.CLEANUP_INTERVAL)
  }

  private stopPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  private evictOldestEntries(count: number): void {
    const entries = Array.from(this.memoryCache.entries())
    
    // Sort by timestamp (oldest first)
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp)
    
    // Remove the oldest entries
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.memoryCache.delete(entries[i][0])
    }
    
    this.updateCacheSize()
  }

  private updateCacheSize(): void {
    this.metrics.cacheSize = this.memoryCache.size
  }

  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item))
    }
    
    const sortedKeys = Object.keys(obj).sort()
    const sortedObj: any = {}
    
    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObjectKeys(obj[key])
    }
    
    return sortedObj
  }

  // Cleanup resources when instance is destroyed
  destroy(): void {
    this.stopPeriodicCleanup()
    this.clear()
  }
}

// Singleton instance for global use
let globalCacheManager: CacheManager | null = null

export function getGlobalCacheManager(): CacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new CacheManager()
  }
  return globalCacheManager
}

// Export cache metrics for monitoring
export function getCacheMetrics(): CacheMetrics {
  return getGlobalCacheManager().getMetrics()
}

// Export cache info for debugging
export function getCacheInfo() {
  return getGlobalCacheManager().getCacheInfo()
}