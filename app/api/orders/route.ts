import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/services/order-service'
import { OrdersAPIRequest, APIError, ErrorCode } from '@/lib/types/api'

const orderService = new OrderService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const apiRequest: OrdersAPIRequest = {
      filters: {},
      pagination: {
        page: parseInt(searchParams.get('page') || '1'),
        limit: Math.min(parseInt(searchParams.get('limit') || '100'), 1000) // Cap at 1000
      },
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }

    // Parse filters
    const categories = searchParams.get('categories')
    if (categories) {
      apiRequest.filters!.categories = categories.split(',').filter(Boolean)
    }

    const sources = searchParams.get('sources')
    if (sources) {
      apiRequest.filters!.sources = sources.split(',').filter(Boolean) as any[]
    }

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate && endDate) {
      apiRequest.filters!.dateRange = {
        start: startDate,
        end: endDate
      }
    }

    const geo = searchParams.get('geo')
    if (geo) {
      apiRequest.filters!.geo = geo.split(',').filter(Boolean)
    }

    // Generate request ID for error tracking
    const requestId = crypto.randomUUID()

    const response = await orderService.getOrders(apiRequest)

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'Cache-Control': 'public, max-age=300' // 5 minutes
      }
    })

  } catch (error) {
    console.error('Orders API error:', error)

    const requestId = crypto.randomUUID()
    const apiError: APIError = {
      code: ErrorCode.DATABASE_ERROR,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      requestId
    }

    // Determine appropriate status code based on error type
    let statusCode = 500
    if (error instanceof Error) {
      if (error.message.includes('Validation failed')) {
        apiError.code = ErrorCode.VALIDATION_ERROR
        statusCode = 400
      } else if (error.message.includes('Database')) {
        apiError.code = ErrorCode.DATABASE_ERROR
        statusCode = 503
      }
    }

    return NextResponse.json(apiError, {
      status: statusCode,
      headers: {
        'X-Request-ID': requestId
      }
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const requestId = crypto.randomUUID()

    // Validate required fields
    const requiredFields = ['customer', 'category', 'date', 'source', 'geo']
    const missingFields = requiredFields.filter(field => !body[field])

    if (missingFields.length > 0) {
      const apiError: APIError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        details: { missingFields },
        timestamp: new Date().toISOString(),
        requestId
      }

      return NextResponse.json(apiError, {
        status: 400,
        headers: { 'X-Request-ID': requestId }
      })
    }

    // Validate source field
    const validSources = ['Online', 'In-Store', 'App', 'Phone']
    if (!validSources.includes(body.source)) {
      const apiError: APIError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: `Invalid source. Must be one of: ${validSources.join(', ')}`,
        details: { validSources },
        timestamp: new Date().toISOString(),
        requestId
      }

      return NextResponse.json(apiError, {
        status: 400,
        headers: { 'X-Request-ID': requestId }
      })
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(body.date)) {
      const apiError: APIError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid date format. Expected YYYY-MM-DD',
        timestamp: new Date().toISOString(),
        requestId
      }

      return NextResponse.json(apiError, {
        status: 400,
        headers: { 'X-Request-ID': requestId }
      })
    }

    const newOrder = await orderService.createOrder({
      customer: body.customer.trim(),
      category: body.category.trim(),
      date: body.date,
      source: body.source,
      geo: body.geo.trim()
    })

    return NextResponse.json(newOrder, {
      status: 201,
      headers: { 'X-Request-ID': requestId }
    })

  } catch (error) {
    console.error('Create order API error:', error)

    const requestId = crypto.randomUUID()
    const apiError: APIError = {
      code: ErrorCode.DATABASE_ERROR,
      message: error instanceof Error ? error.message : 'Failed to create order',
      timestamp: new Date().toISOString(),
      requestId
    }

    return NextResponse.json(apiError, {
      status: 500,
      headers: { 'X-Request-ID': requestId }
    })
  }
}