import { OrderFilters } from '@/lib/types/api'

export class FilterEngine {
  static buildSupabaseQuery<T extends { in: (column: string, values: string[]) => T; gte: (column: string, value: string) => T; lte: (column: string, value: string) => T }>(
    query: T,
    filters: OrderFilters
  ): T {
    let filteredQuery = query

    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      filteredQuery = filteredQuery.in('category', filters.categories)
    }

    // Filter by sources
    if (filters.sources && filters.sources.length > 0) {
      filteredQuery = filteredQuery.in('source', filters.sources)
    }

    // Filter by date range
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        filteredQuery = filteredQuery.gte('date', filters.dateRange.start)
      }
      if (filters.dateRange.end) {
        filteredQuery = filteredQuery.lte('date', filters.dateRange.end)
      }
    }

    // Filter by geography
    if (filters.geo && filters.geo.length > 0) {
      filteredQuery = filteredQuery.in('geo', filters.geo)
    }

    return filteredQuery
  }

  static validateDateRange(start: string, end: string): boolean {
    try {
      const startDate = new Date(start)
      const endDate = new Date(end)
      
      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return false
      }
      
      // Check if start date is before or equal to end date
      return startDate <= endDate
    } catch {
      return false
    }
  }

  static sanitizeFilters(filters: OrderFilters): OrderFilters {
    const sanitized: OrderFilters = {}

    // Sanitize categories
    if (filters.categories && Array.isArray(filters.categories)) {
      sanitized.categories = filters.categories
        .filter(cat => typeof cat === 'string' && cat.trim().length > 0)
        .map(cat => cat.trim())
    }

    // Sanitize sources
    if (filters.sources && Array.isArray(filters.sources)) {
      const validSources = ['Online', 'In-Store', 'App', 'Phone']
      sanitized.sources = filters.sources
        .filter(source => validSources.includes(source))
    }

    // Sanitize date range
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      if (start && end && this.validateDateRange(start, end)) {
        sanitized.dateRange = { start, end }
      }
    }

    // Sanitize geo
    if (filters.geo && Array.isArray(filters.geo)) {
      sanitized.geo = filters.geo
        .filter(location => typeof location === 'string' && location.trim().length > 0)
        .map(location => location.trim())
    }

    return sanitized
  }

  static validateFilters(filters: OrderFilters): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate date range
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      if (start && end && !this.validateDateRange(start, end)) {
        errors.push('Invalid date range: start date must be before or equal to end date')
      }
    }

    // Validate sources
    if (filters.sources && filters.sources.length > 0) {
      const validSources = ['Online', 'In-Store', 'App', 'Phone']
      const invalidSources = filters.sources.filter(source => !validSources.includes(source))
      if (invalidSources.length > 0) {
        errors.push(`Invalid sources: ${invalidSources.join(', ')}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}