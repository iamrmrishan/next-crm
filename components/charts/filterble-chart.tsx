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
import { RefreshCw } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { useChartDataAPI } from "@/hooks/use-orders-api"
import { OrderFilters } from "@/lib/types/api"

// Generic type for data items
type DataItem = {
  id: string
  date: string
  [key: string]: any
}

// Configuration type
type FilterableChartConfig = {
  title: string
  description: string
  groupByKey: string
  filterByKey?: string
  filterOptions?: string[]
  dateKey?: string
  defaultStartDate?: Date
  defaultEndDate?: Date
  chartConfig: ChartConfig
  countLabel?: string
  enableChartTypeToggle?: boolean
  defaultChartType?: "pie" | "bar"
}

type FilterableChartProps = {
  config: FilterableChartConfig
}

export function FilterableChart({ config }: FilterableChartProps) {
  const {
    title,
    description,
    groupByKey,
    filterByKey,
    filterOptions = [],
    dateKey = "date",
    defaultStartDate,
    defaultEndDate,
    chartConfig,
    countLabel = "Items",
    enableChartTypeToggle = true,
    defaultChartType = "pie",
  } = config

  const { 
    chartData: apiChartData, 
    isLoading: chartLoading, 
    error: chartError, 
    metadata,
    fetchChartData 
  } = useChartDataAPI()

  const id = React.useId()
  const [selectedFilter, setSelectedFilter] = React.useState("All")
  const [isBarChart, setIsBarChart] = React.useState(defaultChartType === "bar")
  const [startDate, setStartDate] = React.useState<Date | undefined>(defaultStartDate)
  const [endDate, setEndDate] = React.useState<Date | undefined>(defaultEndDate)

  // Reset filters - memoized callback for performance
  const handleReset = React.useCallback(() => {
    setSelectedFilter("All")
    setIsBarChart(defaultChartType === "bar")
    setStartDate(defaultStartDate)
    setEndDate(defaultEndDate)
  }, [defaultChartType, defaultStartDate, defaultEndDate])

  // Convert chart data from API format
  const chartData = React.useMemo(() => {
    return apiChartData.map((item) => ({
      category: item.label,
      count: item.value,
      fill: chartConfig[item.label as keyof typeof chartConfig]?.color || "var(--chart-1)",
    }))
  }, [apiChartData, chartConfig])

  // Build API filters from current state
  const buildAPIFilters = React.useCallback((): OrderFilters => {
    const filters: OrderFilters = {}
    
    // Add specific filter if not "All"
    if (filterByKey && selectedFilter !== "All") {
      if (filterByKey === 'category') {
        filters.categories = [selectedFilter]
      } else if (filterByKey === 'source') {
        filters.sources = [selectedFilter] as any[]
      } else if (filterByKey === 'geo') {
        filters.geo = [selectedFilter]
      }
    }
    
    // Add date range if both dates are set
    if (startDate && endDate) {
      filters.dateRange = {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    }
    
    return filters
  }, [filterByKey, selectedFilter, startDate, endDate])

  // Fetch chart data when filters change
  React.useEffect(() => {
    const apiFilters = buildAPIFilters()
    fetchChartData(groupByKey, apiFilters)
  }, [selectedFilter, startDate, endDate, groupByKey, fetchChartData, buildAPIFilters])

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

  return (
    <Card data-chart={id} className="flex flex-col">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>

        {/* Chart Type Switch */}
        {enableChartTypeToggle && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Pie</span>
            <Switch checked={isBarChart} onCheckedChange={setIsBarChart} />
            <span className="text-sm text-muted-foreground">Bar</span>
          </div>
        )}

        {/* Filter Dropdown */}
        {filterByKey && filterOptions.length > 0 && (
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="h-7 w-[130px] rounded-lg pl-2.5">
              <SelectValue placeholder="Select filter" />
            </SelectTrigger>
            <SelectContent align="end" className="rounded-xl">
              {["All", ...filterOptions].map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date Range Picker */}
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                {startDate ? formatDate(startDate) : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                {endDate ? formatDate(endDate) : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>

          {/* Reset Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            title="Reset Filters"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
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
          </div>
        ) : (
          <ChartContainer
            id={id}
            config={chartConfig}
            className="mx-auto w-full max-w-[400px] h-[300px]"
          >
            {isBarChart ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="var(--chart-1)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <PieChart accessibilityLayer >
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
                  onClick={(_, idx) =>
                    setActiveCategory(chartData[idx]?.category ?? "")
                  }
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
    </Card>
  )
}