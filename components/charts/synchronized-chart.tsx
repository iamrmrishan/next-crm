"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  Label,
  Pie,
  PieChart,
  Sector,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import { RefreshCw, Filter } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useOrderFilterContext } from "@/contexts/order-filter-context"
import { useChartDataAPI } from "@/hooks/use-orders-api"
import { Badge } from "@/components/ui/badge"

// Configuration type
type SynchronizedChartConfig = {
  title: string
  description: string
  groupByKey: string
  chartConfig: ChartConfig
  countLabel?: string
  enableChartTypeToggle?: boolean
  defaultChartType?: "pie" | "bar"
  enableInteractiveFiltering?: boolean
}

type SynchronizedChartProps = {
  config: SynchronizedChartConfig
}

export function SynchronizedChart({ config }: SynchronizedChartProps) {
  const {
    title,
    description,
    groupByKey,
    chartConfig,
    countLabel = "Items",
    enableChartTypeToggle = true,
    defaultChartType = "pie",
    enableInteractiveFiltering = true,
  } = config

  const { filters, updateFilters, resetFilters } = useOrderFilterContext()
  const { 
    chartData: apiChartData, 
    isLoading: chartLoading, 
    error: chartError, 
    metadata,
    fetchChartData 
  } = useChartDataAPI()
  
  const id = React.useId()
  const [isBarChart, setIsBarChart] = React.useState(defaultChartType === "bar")

  // Convert API chart data to the format expected by the chart components
  const chartData = React.useMemo(() => {
    return apiChartData.map((item) => ({
      category: item.label,
      count: item.value,
      fill: chartConfig[item.label as keyof typeof chartConfig]?.color || "var(--chart-1)",
    }))
  }, [apiChartData, chartConfig])

  // Convert internal filter state to API format
  const convertFiltersToAPI = React.useCallback(() => {
    return {
      categories: filters.categories,
      sources: filters.sources as any[],
      geo: filters.geo,
      dateRange: filters.dateRange.start && filters.dateRange.end ? {
        start: filters.dateRange.start,
        end: filters.dateRange.end
      } : undefined
    }
  }, [filters])

  // Fetch chart data when filters change
  React.useEffect(() => {
    const apiFilters = convertFiltersToAPI()
    fetchChartData(groupByKey, apiFilters)
  }, [filters, groupByKey, fetchChartData, convertFiltersToAPI])

  const [activeCategory, setActiveCategory] = React.useState("")
  
  // Update active category when chart data changes
  React.useEffect(() => {
    if (chartData.length > 0 && !activeCategory) {
      setActiveCategory(chartData[0].category)
    }
  }, [chartData, activeCategory])
  
  const activeIndex = React.useMemo(
    () => chartData.findIndex((item) => item.category === activeCategory),
    [activeCategory, chartData]
  )

  // Handle interactive filtering when clicking on chart segments - memoized for performance
  const handleChartClick = React.useCallback((data: any, index: number) => {
    if (!enableInteractiveFiltering) return
    
    const clickedCategory = chartData[index]?.category
    if (!clickedCategory) return

    // Toggle the category in the filter
    if (groupByKey === 'category') {
      const newCategories = filters.categories.includes(clickedCategory)
        ? filters.categories.filter(c => c !== clickedCategory)
        : [...filters.categories, clickedCategory]
      updateFilters({ categories: newCategories })
    } else if (groupByKey === 'source') {
      const newSources = filters.sources.includes(clickedCategory)
        ? filters.sources.filter(s => s !== clickedCategory)
        : [...filters.sources, clickedCategory]
      updateFilters({ sources: newSources })
    } else if (groupByKey === 'geo') {
      const newGeo = filters.geo.includes(clickedCategory)
        ? filters.geo.filter(g => g !== clickedCategory)
        : [...filters.geo, clickedCategory]
      updateFilters({ geo: newGeo })
    }
  }, [enableInteractiveFiltering, chartData, groupByKey, filters, updateFilters])

  // Check if any filters are active - memoized for performance
  const hasActiveFilters = React.useMemo(() => 
    filters.categories.length > 0 || 
    filters.sources.length > 0 || 
    filters.geo.length > 0 || 
    filters.dateRange.start || 
    filters.dateRange.end
  , [filters])

  // Get active filter count - memoized for performance
  const activeFilterCount = React.useMemo(() => 
    filters.categories.length + 
    filters.sources.length + 
    filters.geo.length + 
    (filters.dateRange.start ? 1 : 0) + 
    (filters.dateRange.end ? 1 : 0)
  , [filters])

  return (
    <Card data-chart={id} className="flex flex-col">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <CardTitle className="flex items-center gap-2">
            {title}
            {hasActiveFilters && (
              <Badge variant="secondary" className="gap-1">
                <Filter className="h-3 w-3" />
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {description}
            {hasActiveFilters && (
              <span className="text-xs block mt-1">
                Showing {metadata.total} filtered results
              </span>
            )}
            {chartLoading && (
              <span className="text-xs block mt-1 text-muted-foreground">
                Loading chart data...
              </span>
            )}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart Type Switch */}
          {enableChartTypeToggle && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Pie</span>
              <Switch checked={isBarChart} onCheckedChange={setIsBarChart} />
              <span className="text-sm text-muted-foreground">Bar</span>
            </div>
          )}

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              title="Reset All Filters"
              className="gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 justify-center items-center pb-4">
        {chartLoading ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p className="text-sm">Loading chart data...</p>
          </div>
        ) : chartError ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-destructive">
            <p className="text-sm mb-2">Failed to load chart data</p>
            <p className="text-xs text-muted-foreground">{chartError}</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
            <p className="text-sm">No data available for the selected filters</p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-2"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <ChartContainer
            id={id}
            config={chartConfig}
            className="mx-auto w-full max-w-[400px] h-[300px]"
          >
            {isBarChart ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  accessibilityLayer 
                  data={chartData}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="var(--chart-1)"
                    style={{ cursor: enableInteractiveFiltering ? 'pointer' : 'default' }}
                    onClick={enableInteractiveFiltering ? (data, index) => {
                      // Find the index in chartData based on the clicked data
                      const clickedIndex = chartData.findIndex(item => item.category === data.category)
                      if (clickedIndex !== -1) {
                        handleChartClick(data, clickedIndex)
                      }
                    } : undefined}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <PieChart accessibilityLayer>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="category"
                  innerRadius={60}
                  strokeWidth={5}
                  activeIndex={activeIndex}
                  activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                    <g>
                      <Sector {...props} outerRadius={outerRadius + 10} />
                      <Sector
                        {...props}
                        outerRadius={outerRadius + 25}
                        innerRadius={outerRadius + 12}
                      />
                    </g>
                  )}
                  onClick={(data, idx) => {
                    setActiveCategory(chartData[idx]?.category ?? "")
                    if (enableInteractiveFiltering) {
                      handleChartClick(data, idx)
                    }
                  }}
                  style={{ cursor: enableInteractiveFiltering ? 'pointer' : 'default' }}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {chartData[activeIndex]?.count ?? 0}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              {countLabel}
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            )}
          </ChartContainer>
        )}
      </CardContent>

      {/* Interactive Filtering Hint */}
      {enableInteractiveFiltering && chartData.length > 0 && (
        <div className="px-6 pb-4">
          <p className="text-xs text-muted-foreground text-center">
            Click on chart segments to filter data
          </p>
        </div>
      )}
    </Card>
  )
}