import { getCacheInfo, getCacheMetrics } from '@/lib/services/cache-manager'

export class CacheMonitor {
  static logCacheStats(): void {
    const info = getCacheInfo()
    const metrics = getCacheMetrics()
    
    console.log('=== Cache Statistics ===')
    console.log(`Cache Size: ${info.size}/${info.maxSize}`)
    console.log(`Hit Ratio: ${(info.hitRatio * 100).toFixed(2)}%`)
    console.log(`Total Requests: ${metrics.totalRequests}`)
    console.log(`Cache Hits: ${metrics.hits}`)
    console.log(`Cache Misses: ${metrics.misses}`)
    console.log(`Last Cleanup: ${new Date(metrics.lastCleanup).toISOString()}`)
    console.log('========================')
  }

  static getCacheHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical'
    hitRatio: number
    size: number
    maxSize: number
    recommendations: string[]
  } {
    const info = getCacheInfo()
    const recommendations: string[] = []
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'

    // Check hit ratio
    if (info.hitRatio < 0.3) {
      status = 'critical'
      recommendations.push('Cache hit ratio is very low. Consider reviewing cache strategy.')
    } else if (info.hitRatio < 0.6) {
      status = 'warning'
      recommendations.push('Cache hit ratio could be improved.')
    }

    // Check cache size
    const sizeRatio = info.size / info.maxSize
    if (sizeRatio > 0.9) {
      if (status !== 'critical') status = 'warning'
      recommendations.push('Cache is nearly full. Consider increasing max size or improving eviction.')
    }

    // Check if cache is being used
    if (info.metrics.totalRequests === 0) {
      status = 'warning'
      recommendations.push('Cache has not been used yet.')
    }

    return {
      status,
      hitRatio: info.hitRatio,
      size: info.size,
      maxSize: info.maxSize,
      recommendations
    }
  }

  static async monitorCachePerformance(duration: number = 60000): Promise<void> {
    console.log(`Starting cache performance monitoring for ${duration / 1000} seconds...`)
    
    const startMetrics = getCacheMetrics()
    const startTime = Date.now()
    
    setTimeout(() => {
      const endMetrics = getCacheMetrics()
      const endTime = Date.now()
      
      const requestsDelta = endMetrics.totalRequests - startMetrics.totalRequests
      const hitsDelta = endMetrics.hits - startMetrics.hits
      const missesDelta = endMetrics.misses - startMetrics.misses
      const timeDelta = endTime - startTime
      
      console.log('=== Cache Performance Report ===')
      console.log(`Monitoring Duration: ${timeDelta / 1000}s`)
      console.log(`Requests During Period: ${requestsDelta}`)
      console.log(`Hits During Period: ${hitsDelta}`)
      console.log(`Misses During Period: ${missesDelta}`)
      console.log(`Hit Ratio During Period: ${requestsDelta > 0 ? ((hitsDelta / requestsDelta) * 100).toFixed(2) : 0}%`)
      console.log(`Requests Per Second: ${(requestsDelta / (timeDelta / 1000)).toFixed(2)}`)
      console.log('================================')
    }, duration)
  }

  static generateCacheReport(): {
    timestamp: string
    metrics: ReturnType<typeof getCacheMetrics>
    info: ReturnType<typeof getCacheInfo>
    health: ReturnType<typeof CacheMonitor.getCacheHealthStatus>
  } {
    return {
      timestamp: new Date().toISOString(),
      metrics: getCacheMetrics(),
      info: getCacheInfo(),
      health: this.getCacheHealthStatus()
    }
  }
}