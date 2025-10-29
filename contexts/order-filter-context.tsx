"use client"

import React, { createContext, useContext, ReactNode, useEffect, useCallback, useRef } from 'react'
import { Order } from '@/types/order-type'
import { useOrderFilters, UseOrderFiltersReturn } from '@/hooks/use-order-filters'
import { useOrdersAPI, UseOrdersAPIReturn } from '@/hooks/use-orders-api'
import { OrderFilters } from '@/lib/types/api'

interface OrderFilterContextType extends Omit<UseOrderFiltersReturn, 'filteredData'> {
  // API-related properties
  orders: Order[]
  apiLoading: boolean
  apiError: string | null
  pagination: UseOrdersAPIReturn['pagination']
  refetchOrders: () => Promise<void>
  loadAllRecords: () => Promise<void>
  // Computed properties
  filteredData: Order[] // This will be the orders from API (already filtered)
  totalUnfilteredCount: number
}

const OrderFilterContext = createContext<OrderFilterContextType | undefined>(undefined)

interface OrderFilterProviderProps {
  children: ReactNode
}

export const OrderFilterProvider: React.FC<OrderFilterProviderProps> = ({
  children
}) => {
  const filterState = useOrderFilters([]) // Start with empty array since we'll use API data
  const {
    orders,
    isLoading: apiLoading,
    error: apiError,
    pagination,
    refetch: refetchOrders,
    fetchWithFilters
  } = useOrdersAPI()

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced filter application
  const applyFiltersToAPI = useCallback(
    async (filters: OrderFilters, limit?: number) => {
      try {
        await fetchWithFilters(filters, 1, limit || pagination.limit)
      } catch (error) {
        console.error('Error applying filters:', error)
      }
    },
    [fetchWithFilters, pagination.limit]
  )

  // Debounced version of applyFiltersToAPI
  const debouncedApplyFilters = useCallback(
    (filters: OrderFilters) => {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        applyFiltersToAPI(filters)
      }, 300) // 300ms debounce delay
    },
    [applyFiltersToAPI]
  )

  // Convert internal filter state to API format
  const convertFiltersToAPI = useCallback((filters: typeof filterState.filters): OrderFilters => {
    return {
      categories: filters.categories,
      sources: filters.sources as any[],
      geo: filters.geo,
      dateRange: filters.dateRange.start && filters.dateRange.end ? {
        start: filters.dateRange.start,
        end: filters.dateRange.end
      } : undefined
    }
  }, [])

  // Load all records function
  const loadAllRecords = useCallback(async () => {
    const apiFilters = convertFiltersToAPI(filterState.filters)
    await applyFiltersToAPI(apiFilters, 1000) // Load up to 1000 records
  }, [filterState.filters, convertFiltersToAPI, applyFiltersToAPI])

  // Apply filters when filter state changes (debounced)
  useEffect(() => {
    const apiFilters = convertFiltersToAPI(filterState.filters)
    debouncedApplyFilters(apiFilters)

    // Cleanup function to clear timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [filterState.filters, convertFiltersToAPI, debouncedApplyFilters])

  // Enhanced context value
  const contextValue: OrderFilterContextType = {
    ...filterState,
    // Override filteredData to use API orders (which are already filtered)
    filteredData: orders,
    // API-related properties
    orders,
    apiLoading,
    apiError,
    pagination,
    refetchOrders,
    loadAllRecords,
    // Additional computed properties
    totalUnfilteredCount: pagination.total
  }

  return (
    <OrderFilterContext.Provider value={contextValue}>
      {children}
    </OrderFilterContext.Provider>
  )
}

export const useOrderFilterContext = (): OrderFilterContextType => {
  const context = useContext(OrderFilterContext)
  if (context === undefined) {
    throw new Error('useOrderFilterContext must be used within an OrderFilterProvider')
  }
  return context
}