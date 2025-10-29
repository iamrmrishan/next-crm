import { NextRequest, NextResponse } from 'next/server'
import { OrderService } from '@/lib/services/order-service'
import { ChartDataRequest, APIError, ErrorCode } from '@/lib/types/api'

const orderService = new OrderService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse chart type (required)
    const type = searchParams.get('type') as ChartDataRequest['type']
    if (!type) {
      const requestId = crypto.randomUUID()
      const apiError: APIError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Chart type is required. Must be one of: category, source, geo, timeline',
        details: { validTypes: ['category', 'source', 'geo', 'timeline'] },
        timestamp: new Date().toISOString(),
        requestId
      }

      return NextResponse.json(apiError, {
        status: 400,
        headers: { 'X-Request-ID': requestId }
      })
    }

    // Validate chart type
    const validTypes = ['category', 'source', 'geo', 'timeline']
    if (!validTypes.includes(type)) {
      const requestId = crypto.randomUUID()
      const apiError: APIError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: `Invalid chart type: ${type}. Must be one of: ${validTypes.join(', ')}`,
        details: { validTypes },
        timestamp: new Date().toISOString(),
        requestId
      }

      return NextResponse.json(apiError, {
        status: 400,
        headers: { 'X-Request-ID': requestId }
      })
    }

    // Build chart data request
    const chartRequest: ChartDataRequest = {
      type,
      filters: {},
      aggregation: (searchParams.get('aggregation') as 'count' | 'sum' | 'avg') || 'count',
      groupBy: (searchParams.get('groupBy') as 'day' | 'week' | 'month') || 'day'
    }

    // Parse filters (same as orders API)
    const categories = searchParams.get('categories')
    if (categories) {
      chartRequest.filters!.categories = categories.split(',').filter(Boolean)
    }

    const sources = searchParams.get('sources')
    if (sources) {
      chartRequest.filters!.sources = sources.split(',').filter(Boolean) as any[]
    }

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate && endDate) {
      chartRequest.filters!.dateRange = {
        start: startDate,
        end: endDate
      }
    }

    const geo = searchParams.get('geo')
    if (geo) {
      chartRequest.filters!.geo = geo.split(',').filter(Boolean)
    }

    // Validate aggregation type
    const validAggregations = ['count', 'sum', 'avg']
    if (chartRequest.aggregation && !validAggregations.includes(chartRequest.aggregation)) {
      const requestId = crypto.randomUUID()
      const apiError: APIError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: `Invalid aggregation type: ${chartRequest.aggregation}. Must be one of: ${validAggregations.join(', ')}`,
        details: { validAggregations },
        timestamp: new Date().toISOString(),
        requestId
      }

      return NextResponse.json(apiError, {
        status: 400,
        headers: { 'X-Request-ID': requestId }
      })
    }

    // Validate groupBy for timeline charts
    if (type === 'timeline') {
      const validGroupBy = ['day', 'week', 'month']
      if (chartRequest.groupBy && !validGroupBy.includes(chartRequest.groupBy)) {
        const requestId = crypto.randomUUID()
        const apiError: APIError = {
          code: ErrorCode.VALIDATION_ERROR,
          message: `Invalid groupBy for timeline chart: ${chartRequest.groupBy}. Must be one of: ${validGroupBy.join(', ')}`,
          details: { validGroupBy },
          timestamp: new Date().toISOString(),
          requestId
        }

        return NextResponse.json(apiError, {
          status: 400,
          headers: { 'X-Request-ID': requestId }
        })
      }
    }

    // Generate request ID for tracking
    const requestId = crypto.randomUUID()

    const response = await orderService.getChartData(chartRequest)

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'Cache-Control': 'public, max-age=300' // 5 minutes - same as orders API
      }
    })

  } catch (error) {
    console.error('Chart data API error:', error)

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
    if (!body.type) {
      const apiError: APIError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Chart type is required',
        timestamp: new Date().toISOString(),
        requestId
      }

      return NextResponse.json(apiError, {
        status: 400,
        headers: { 'X-Request-ID': requestId }
      })
    }

    // Validate chart type
    const validTypes = ['category', 'source', 'geo', 'timeline']
    if (!validTypes.includes(body.type)) {
      const apiError: APIError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: `Invalid chart type: ${body.type}. Must be one of: ${validTypes.join(', ')}`,
        details: { validTypes },
        timestamp: new Date().toISOString(),
        requestId
      }

      return NextResponse.json(apiError, {
        status: 400,
        headers: { 'X-Request-ID': requestId }
      })
    }

    const chartRequest: ChartDataRequest = {
      type: body.type,
      filters: body.filters || {},
      aggregation: body.aggregation || 'count',
      groupBy: body.groupBy || 'day'
    }

    const response = await orderService.getChartData(chartRequest)

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'Cache-Control': 'public, max-age=300'
      }
    })

  } catch (error) {
    console.error('Chart data POST API error:', error)

    const requestId = crypto.randomUUID()
    const apiError: APIError = {
      code: ErrorCode.DATABASE_ERROR,
      message: error instanceof Error ? error.message : 'Failed to fetch chart data',
      timestamp: new Date().toISOString(),
      requestId
    }

    return NextResponse.json(apiError, {
      status: 500,
      headers: { 'X-Request-ID': requestId }
    })
  }
}