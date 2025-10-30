"use client"

import { useState, useCallback, useMemo } from 'react'
import { Order } from '@/types/order-type'

export interface FilterState {
  categories: string[]
  sources: string[]
  dateRange: {
    start: string | null
    end: string | null
  }
  geo: string[]
}

export interface UseOrderFiltersReturn {
  filters: FilterState
  updateFilters: (newFilters: Partial<FilterState>) => void
  resetFilters: () => void
  filteredData: Order[]
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const initialFilters: FilterState = {
  categories: [],
  sources: [],
  dateRange: {
    start: null,
    end: null
  },
  geo: []
}

export const useOrderFilters = (data: Order[]): UseOrderFiltersReturn => {
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  const [isLoading, setIsLoading] = useState(false)

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      // Handle nested dateRange updates properly
      ...(newFilters.dateRange && {
        dateRange: {
          ...prev.dateRange,
          ...newFilters.dateRange
        }
      })
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [])

  // Filter data based on current filter state
  const filteredData = useMemo(() => {
    return data.filter((order) => {
      // Category filter
      const matchesCategory = filters.categories.length === 0 || 
        filters.categories.includes(order.category)

      // Source filter
      const matchesSource = filters.sources.length === 0 || 
        filters.sources.includes(order.source)

      // Geography filter
      const matchesGeo = filters.geo.length === 0 || 
        filters.geo.includes(order.geo)

      // Date range filter
      const orderDate = new Date(order.date)
      const matchesDateRange = 
        (!filters.dateRange.start || orderDate >= new Date(filters.dateRange.start)) &&
        (!filters.dateRange.end || orderDate <= new Date(filters.dateRange.end))

      return matchesCategory && matchesSource && matchesGeo && matchesDateRange
    })
  }, [data, filters])

  return {
    filters,
    updateFilters,
    resetFilters,
    filteredData,
    isLoading,
    setIsLoading
  }
}

// Helper functions for extracting unique values from data
export const getUniqueCategories = (data: Order[]): string[] => {
  return Array.from(new Set(data.map(order => order.category))).sort()
}

export const getUniqueSources = (data: Order[]): string[] => {
  return Array.from(new Set(data.map(order => order.source))).sort()
}

export const getUniqueGeoLocations = (data: Order[]): string[] => {
  return Array.from(new Set(data.map(order => order.geo))).sort()
}

// Validation functions
export const validateDateRange = (start: string | null, end: string | null): boolean => {
  if (!start || !end) return true
  return new Date(start) <= new Date(end)
}

export const sanitizeFilters = (filters: FilterState): FilterState => {
  return {
    categories: filters.categories.filter(Boolean),
    sources: filters.sources.filter(Boolean),
    geo: filters.geo.filter(Boolean),
    dateRange: {
      start: filters.dateRange.start,
      end: filters.dateRange.end
    }
  }
}