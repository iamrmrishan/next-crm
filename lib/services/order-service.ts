import { createClient } from '@/utils/supabase/server'
import { ServerDatabaseManager } from '@/utils/supabase/server'
import { Order } from '@/types/order-type'
import { 
  OrdersAPIRequest, 
  OrdersAPIResponse, 
  ChartDataRequest, 
  ChartDataResponse,
  ChartDataPoint,
  OrderFilters
} from '@/lib/types/api'
import { FilterEngine } from './filter-engine'
import { getGlobalCacheManager } from './cache-manager'

export class OrderService {
  private cacheManager = getGlobalCacheManager()

  constructor() {
    // Cache manager is now a singleton
  }

  async getOrders(request: OrdersAPIRequest): Promise<OrdersAPIResponse> {
    // Generate cache key
    const cacheKey = this.cacheManager.generateKey(request as Record<string, unknown>)
    
    // Check cache first
    const cachedResult = this.cacheManager.get<OrdersAPIResponse>(cacheKey)
    if (cachedResult) {
      return {
        ...cachedResult,
        cacheInfo: {
          ...cachedResult.cacheInfo,
          cached: true
        }
      }
    }

    // Validate and sanitize filters
    const sanitizedFilters = request.filters ? FilterEngine.sanitizeFilters(request.filters) : {}
    const validation = FilterEngine.validateFilters(sanitizedFilters)
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    try {
      const result = await ServerDatabaseManager.executeWithRetry(async () => {
        const supabase = await createClient()
        
        // Build base query
        let query = supabase.from('orders').select('*', { count: 'exact' })
        
        // Apply filters
        if (sanitizedFilters) {
          query = FilterEngine.buildSupabaseQuery(query, sanitizedFilters)
        }
        
        // Apply sorting
        if (request.sortBy) {
          query = query.order(request.sortBy, { 
            ascending: request.sortOrder !== 'desc' 
          })
        } else {
          // Default sort by date descending
          query = query.order('date', { ascending: false })
        }
        
        // Apply pagination
        const page = request.pagination?.page || 1
        const limit = request.pagination?.limit || 50
        const offset = (page - 1) * limit
        
        query = query.range(offset, offset + limit - 1)
        
        const { data, error, count } = await query
        
        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }
        
        return { data: data || [], count: count || 0 }
      }, 'getOrders')

      const totalPages = Math.ceil(result.count / (request.pagination?.limit || 50))
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes

      const response: OrdersAPIResponse = {
        data: result.data,
        pagination: {
          total: result.count,
          page: request.pagination?.page || 1,
          limit: request.pagination?.limit || 50,
          totalPages
        },
        cacheInfo: {
          cached: false,
          cacheKey,
          expiresAt
        }
      }

      // Cache the result
      this.cacheManager.set(cacheKey, response)

      return response
    } catch (error) {
      console.error('OrderService.getOrders error:', error)
      throw new Error(`Failed to fetch orders: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getChartData(request: ChartDataRequest): Promise<ChartDataResponse> {
    // Generate cache key for chart data
    const cacheKey = this.cacheManager.generateKey({ ...request, type: 'chart' } as Record<string, unknown>)
    
    // Check cache first
    const cachedResult = this.cacheManager.get<ChartDataResponse>(cacheKey)
    if (cachedResult) {
      return {
        ...cachedResult,
        cacheInfo: {
          ...cachedResult.cacheInfo,
          cached: true
        }
      }
    }

    // Validate and sanitize filters
    const sanitizedFilters = request.filters ? FilterEngine.sanitizeFilters(request.filters) : {}
    const validation = FilterEngine.validateFilters(sanitizedFilters)
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    try {
      const result = await ServerDatabaseManager.executeWithRetry(async () => {
        const supabase = await createClient()
        
        // Build base query
        let query = supabase.from('orders').select('*')
        
        // Apply filters
        if (sanitizedFilters) {
          query = FilterEngine.buildSupabaseQuery(query, sanitizedFilters)
        }
        
        const { data, error } = await query
        
        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }
        
        return data || []
      }, 'getChartData')

      // Process data based on chart type
      const chartData = this.processChartData(result, request.type, request.groupBy)
      const total = result.length
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes

      const response: ChartDataResponse = {
        data: chartData,
        metadata: {
          total,
          aggregationType: request.aggregation || 'count',
          timeRange: this.getTimeRange(sanitizedFilters)
        },
        cacheInfo: {
          cached: false,
          cacheKey,
          expiresAt
        }
      }

      // Cache the result
      this.cacheManager.set(cacheKey, response)

      return response
    } catch (error) {
      console.error('OrderService.getChartData error:', error)
      throw new Error(`Failed to fetch chart data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async createOrder(order: Omit<Order, 'id'>): Promise<Order> {
    try {
      return await ServerDatabaseManager.executeWithRetry(async () => {
        const supabase = await createClient()
        
        const { data, error } = await supabase
          .from('orders')
          .insert([order])
          .select()
          .single()
        
        if (error) {
          throw new Error(`Failed to create order: ${error.message}`)
        }
        
        // Invalidate cache
        this.cacheManager.invalidate('orders')
        
        return data
      }, 'createOrder')
    } catch (error) {
      console.error('OrderService.createOrder error:', error)
      throw new Error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    try {
      return await ServerDatabaseManager.executeWithRetry(async () => {
        const supabase = await createClient()
        
        const { data, error } = await supabase
          .from('orders')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        
        if (error) {
          throw new Error(`Failed to update order: ${error.message}`)
        }
        
        // Invalidate cache
        this.cacheManager.invalidate('orders')
        
        return data
      }, 'updateOrder')
    } catch (error) {
      console.error('OrderService.updateOrder error:', error)
      throw new Error(`Failed to update order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteOrder(id: string): Promise<void> {
    try {
      await ServerDatabaseManager.executeWithRetry(async () => {
        const supabase = await createClient()
        
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', id)
        
        if (error) {
          throw new Error(`Failed to delete order: ${error.message}`)
        }
        
        // Invalidate cache
        this.cacheManager.invalidate('orders')
      }, 'deleteOrder')
    } catch (error) {
      console.error('OrderService.deleteOrder error:', error)
      throw new Error(`Failed to delete order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      return await ServerDatabaseManager.executeWithRetry(async () => {
        const supabase = await createClient()
        
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single()
        
        if (error) {
          if (error.code === 'PGRST116') {
            return null // No rows found
          }
          throw new Error(`Failed to fetch order: ${error.message}`)
        }
        
        return data
      }, 'getOrderById')
    } catch (error) {
      console.error('OrderService.getOrderById error:', error)
      throw new Error(`Failed to fetch order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private processChartData(
    orders: Order[], 
    type: ChartDataRequest['type'], 
    groupBy?: ChartDataRequest['groupBy']
  ): ChartDataPoint[] {
    switch (type) {
      case 'category':
        return this.aggregateByField(orders, 'category')
      case 'source':
        return this.aggregateByField(orders, 'source')
      case 'geo':
        return this.aggregateByField(orders, 'geo')
      case 'timeline':
        return this.aggregateByTimeline(orders, groupBy || 'day')
      default:
        return []
    }
  }

  private aggregateByField(orders: Order[], field: keyof Order): ChartDataPoint[] {
    const counts = orders.reduce((acc, order) => {
      const value = order[field] as string
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const total = orders.length
    
    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0
    }))
  }

  private aggregateByTimeline(orders: Order[], groupBy: 'day' | 'week' | 'month'): ChartDataPoint[] {
    const groups = orders.reduce((acc, order) => {
      const date = new Date(order.date)
      let key: string
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        default:
          key = date.toISOString().split('T')[0]
      }
      
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({
        label,
        value
      }))
  }

  private getTimeRange(filters: OrderFilters): string {
    if (filters.dateRange) {
      return `${filters.dateRange.start} to ${filters.dateRange.end}`
    }
    return 'All time'
  }
}