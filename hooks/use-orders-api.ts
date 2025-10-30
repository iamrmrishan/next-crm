"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Order } from '@/types/order-type'
import { OrdersAPIResponse, ChartDataResponse, OrderFilters } from '@/lib/types/api'

export interface UseOrdersAPIReturn {
    orders: Order[]
    isLoading: boolean
    error: string | null
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
    refetch: () => Promise<void>
    fetchWithFilters: (filters: OrderFilters, page?: number, limit?: number) => Promise<void>
}

export const useOrdersAPI = (initialFilters?: OrderFilters): UseOrdersAPIReturn => {
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0
    })

    // Ref to track the latest request to avoid race conditions
    const latestRequestRef = useRef<number>(0)

    const buildQueryParams = useCallback((filters: OrderFilters, page = 1, limit = 100) => {
        const params = new URLSearchParams()

        params.set('page', page.toString())
        params.set('limit', limit.toString())

        if (filters.categories && filters.categories.length > 0) {
            params.set('categories', filters.categories.join(','))
        }

        if (filters.sources && filters.sources.length > 0) {
            params.set('sources', filters.sources.join(','))
        }

        if (filters.geo && filters.geo.length > 0) {
            params.set('geo', filters.geo.join(','))
        }

        if (filters.dateRange?.start && filters.dateRange?.end) {
            params.set('startDate', filters.dateRange.start)
            params.set('endDate', filters.dateRange.end)
        }

        return params.toString()
    }, [])

    const fetchOrders = useCallback(async (filters: OrderFilters = {}, page = 1, limit = 100) => {
        const requestId = ++latestRequestRef.current
        setIsLoading(true)
        setError(null)

        try {
            const queryParams = buildQueryParams(filters, page, limit)
            const response = await fetch(`/api/orders?${queryParams}`)

            // Check if this is still the latest request
            if (requestId !== latestRequestRef.current) {
                return // Ignore outdated requests
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
            }

            const data: OrdersAPIResponse = await response.json()

            // Double-check request is still latest before updating state
            if (requestId === latestRequestRef.current) {
                setOrders(data.data)
                setPagination(data.pagination)
            }
        } catch (err) {
            if (requestId === latestRequestRef.current) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders'
                setError(errorMessage)
                console.error('Error fetching orders:', err)
            }
        } finally {
            if (requestId === latestRequestRef.current) {
                setIsLoading(false)
            }
        }
    }, [buildQueryParams])

    const refetch = useCallback(async () => {
        await fetchOrders(initialFilters || {}, pagination.page, pagination.limit)
    }, [fetchOrders, initialFilters, pagination.page, pagination.limit])

    const fetchWithFilters = useCallback(async (filters: OrderFilters, page = 1, limit = 100) => {
        await fetchOrders(filters, page, limit)
    }, [fetchOrders])

    // Initial fetch
    useEffect(() => {
        fetchOrders(initialFilters || {})
    }, [fetchOrders, initialFilters]) // Include dependencies

    return {
        orders,
        isLoading,
        error,
        pagination,
        refetch,
        fetchWithFilters
    }
}

export interface UseChartDataAPIReturn {
    chartData: { label: string; value: number }[]
    isLoading: boolean
    error: string | null
    metadata: {
        total: number
        aggregationType: string
        timeRange: string
    }
    refetch: () => Promise<void>
    fetchChartData: (type: string, filters: OrderFilters) => Promise<void>
}

export const useChartDataAPI = (): UseChartDataAPIReturn => {
    const [chartData, setChartData] = useState<{ label: string; value: number }[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [metadata, setMetadata] = useState({
        total: 0,
        aggregationType: 'count',
        timeRange: 'All time'
    })
    const [lastRequest, setLastRequest] = useState<{ type: string; filters: OrderFilters } | null>(null)

    // Ref to track the latest request to avoid race conditions
    const latestChartRequestRef = useRef<number>(0)

    const buildChartQueryParams = useCallback((type: string, filters: OrderFilters) => {
        const params = new URLSearchParams()

        params.set('type', type)

        if (filters.categories && filters.categories.length > 0) {
            params.set('categories', filters.categories.join(','))
        }

        if (filters.sources && filters.sources.length > 0) {
            params.set('sources', filters.sources.join(','))
        }

        if (filters.geo && filters.geo.length > 0) {
            params.set('geo', filters.geo.join(','))
        }

        if (filters.dateRange?.start && filters.dateRange?.end) {
            params.set('startDate', filters.dateRange.start)
            params.set('endDate', filters.dateRange.end)
        }

        return params.toString()
    }, [])

    const fetchChartData = useCallback(async (type: string, filters: OrderFilters = {}) => {
        const requestId = ++latestChartRequestRef.current
        setIsLoading(true)
        setError(null)
        setLastRequest({ type, filters })

        try {
            const queryParams = buildChartQueryParams(type, filters)
            const response = await fetch(`/api/orders/chart?${queryParams}`)

            // Check if this is still the latest request
            if (requestId !== latestChartRequestRef.current) {
                return // Ignore outdated requests
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
            }

            const data: ChartDataResponse = await response.json()

            // Double-check request is still latest before updating state
            if (requestId === latestChartRequestRef.current) {
                setChartData(data.data)
                setMetadata(data.metadata)
            }
        } catch (err) {
            if (requestId === latestChartRequestRef.current) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chart data'
                setError(errorMessage)
                console.error('Error fetching chart data:', err)
            }
        } finally {
            if (requestId === latestChartRequestRef.current) {
                setIsLoading(false)
            }
        }
    }, [buildChartQueryParams])

    const refetch = useCallback(async () => {
        if (lastRequest) {
            await fetchChartData(lastRequest.type, lastRequest.filters)
        }
    }, [fetchChartData, lastRequest])

    return {
        chartData,
        isLoading,
        error,
        metadata,
        refetch,
        fetchChartData
    }
}