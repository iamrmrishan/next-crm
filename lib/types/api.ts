import { Order } from '@/types/order-type'

export interface OrderFilters {
  categories?: string[]
  sources?: string[]
  dateRange?: {
    start: string
    end: string
  }
  geo?: string[]
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface OrdersAPIRequest {
  filters?: OrderFilters
  pagination?: PaginationParams
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface OrdersAPIResponse {
  data: Order[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  cacheInfo: {
    cached: boolean
    cacheKey: string
    expiresAt: string
  }
}

export interface ChartDataPoint {
  label: string
  value: number
  percentage?: number
  metadata?: Record<string, unknown>
}

export interface ChartDataRequest {
  type: 'category' | 'source' | 'geo' | 'timeline'
  filters?: OrderFilters
  aggregation?: 'count' | 'sum' | 'avg'
  groupBy?: 'day' | 'week' | 'month'
}

export interface ChartDataResponse {
  data: ChartDataPoint[]
  metadata: {
    total: number
    aggregationType: string
    timeRange: string
  }
  cacheInfo: {
    cached: boolean
    cacheKey: string
    expiresAt: string
  }
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR'
}

export interface APIError {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
  timestamp: string
  requestId: string
}