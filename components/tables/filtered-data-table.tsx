"use client"

import * as React from "react"
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    ColumnDef,
    SortingState,
    getSortedRowModel,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, X, Download, Filter, ChevronUp, Calendar as CalendarIcon, Tag, MapPin, Globe, Search } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { DateRange } from "react-day-picker"
import { DataTablePagination } from "./data-table-pagination"
import { useOrderFilterContext } from "@/contexts/order-filter-context"
import { Badge } from "@/components/ui/badge"
import { getUniqueCategories, getUniqueSources, getUniqueGeoLocations } from "@/hooks/use-order-filters"
import { Order } from "@/types/order-type"
import { downloadCSV, formatOrdersForCSV } from "@/lib/utils/csv-export"

interface FilteredDataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    title?: string
    description?: string
}

export function FilteredDataTable<TData, TValue>({
    columns,
    title,
    description,
}: FilteredDataTableProps<TData, TValue>) {
    const {
        filteredData,
        filters,
        updateFilters,
        resetFilters,
        apiLoading,
        apiError,
        pagination,
        loadAllRecords
    } = useOrderFilterContext()
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [localSearchTerm, setLocalSearchTerm] = React.useState("")
    const [searchColumn, setSearchColumn] = React.useState<string>("customer")
    const [filtersOpen, setFiltersOpen] = React.useState(false)
    const [isMobile, setIsMobile] = React.useState(false)
    const [datePickerOpen, setDatePickerOpen] = React.useState(false)
    const [selectedDateRange, setSelectedDateRange] = React.useState<DateRange | undefined>({
        from: filters.dateRange.start ? new Date(filters.dateRange.start) : undefined,
        to: filters.dateRange.end ? new Date(filters.dateRange.end) : undefined,
    })

    // Check if mobile on mount and resize
    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Get unique values for filter options - memoized for performance
    const allData = filteredData as Order[]
    const uniqueCategories = React.useMemo(() => getUniqueCategories(allData), [allData])
    const uniqueSources = React.useMemo(() => getUniqueSources(allData), [allData])
    const uniqueGeoLocations = React.useMemo(() => getUniqueGeoLocations(allData), [allData])

    // Apply local search filter on top of context filters - memoized for performance
    const searchFilteredData = React.useMemo(() => {
        if (!localSearchTerm) return filteredData

        const searchTerm = localSearchTerm.toLowerCase()
        return filteredData.filter((item: any) => {
            const value = item[searchColumn]?.toString().toLowerCase() || ""
            return value.includes(searchTerm)
        })
    }, [filteredData, localSearchTerm, searchColumn])

    const table = useReactTable({
        data: searchFilteredData as TData[],
        columns,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    })

    // Handle multi-select filters - memoized callbacks for performance
    const handleCategoryToggle = React.useCallback((category: string) => {
        const newCategories = filters.categories.includes(category)
            ? filters.categories.filter(c => c !== category)
            : [...filters.categories, category]
        updateFilters({ categories: newCategories })
    }, [filters.categories, updateFilters])

    const handleSourceToggle = React.useCallback((source: string) => {
        const newSources = filters.sources.includes(source)
            ? filters.sources.filter(s => s !== source)
            : [...filters.sources, source]
        updateFilters({ sources: newSources })
    }, [filters.sources, updateFilters])

    const handleGeoToggle = React.useCallback((geo: string) => {
        const newGeo = filters.geo.includes(geo)
            ? filters.geo.filter(g => g !== geo)
            : [...filters.geo, geo]
        updateFilters({ geo: newGeo })
    }, [filters.geo, updateFilters])

    const handleDateRangeChange = React.useCallback((type: 'start' | 'end', value: string) => {
        updateFilters({
            dateRange: {
                ...filters.dateRange,
                [type]: value || null
            }
        })
    }, [filters.dateRange, updateFilters])

    // Handle calendar date selection
    const handleCalendarSelect = React.useCallback((range: DateRange | undefined) => {
        if (range) {
            setSelectedDateRange(range)
            updateFilters({
                dateRange: {
                    start: range.from ? range.from.toISOString().split('T')[0] : null,
                    end: range.to ? range.to.toISOString().split('T')[0] : null
                }
            })
        }
    }, [updateFilters])

    // Sync calendar state with filters
    React.useEffect(() => {
        setSelectedDateRange({
            from: filters.dateRange.start ? new Date(filters.dateRange.start) : undefined,
            to: filters.dateRange.end ? new Date(filters.dateRange.end) : undefined,
        })
    }, [filters.dateRange])

    const clearFilter = React.useCallback((filterType: 'categories' | 'sources' | 'geo' | 'dateRange') => {
        if (filterType === 'dateRange') {
            updateFilters({ dateRange: { start: null, end: null } })
        } else {
            updateFilters({ [filterType]: [] })
        }
    }, [updateFilters])

    const hasActiveFilters = React.useMemo(() =>
        filters.categories.length > 0 ||
        filters.sources.length > 0 ||
        filters.geo.length > 0 ||
        filters.dateRange.start ||
        filters.dateRange.end
        , [filters])

    // CSV Export functionality
    const exportToCSV = React.useCallback(() => {
        const dataToExport = searchFilteredData as Order[]
        const formattedData = formatOrdersForCSV(dataToExport)

        downloadCSV(formattedData, {
            filename: 'orders-export',
            datePrefix: true
        })
    }, [searchFilteredData])

    return (
        <div className="space-y-4">
            {(title || description) && (
                <div className="space-y-1">
                    {title && (
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
                    )}
                    {description && (
                        <p className="text-muted-foreground text-sm">{description}</p>
                    )}
                </div>
            )}

            {/* Clean header with search and actions */}
            <div className="space-y-3">
                {/* Search bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder={`Search orders by ${searchColumn}...`}
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                        className="pl-10 pr-32"
                    />
                    <div className="absolute right-1 top-1 bottom-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-full px-3 text-xs">
                                    {searchColumn} <ChevronDown className="ml-1 h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Search by</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup value={searchColumn} onValueChange={setSearchColumn}>
                                    <DropdownMenuRadioItem value="customer">Customer</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="category">Category</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="source">Source</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="geo">Location</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
                    <div className="flex gap-2">
                        <Button
                            variant={filtersOpen ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFiltersOpen(!filtersOpen)}
                            className="flex-1 sm:flex-none"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                            {hasActiveFilters && (
                                <span className="ml-1 bg-background text-foreground rounded-full text-xs px-1.5 py-0.5 border">
                                    {[
                                        filters.categories.length,
                                        filters.sources.length,
                                        filters.geo.length,
                                        (filters.dateRange.start || filters.dateRange.end) ? 1 : 0
                                    ].reduce((a, b) => a + b, 0)}
                                </span>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportToCSV}
                            disabled={apiLoading || searchFilteredData.length === 0}
                            className="flex-1 sm:flex-none"
                            title={`Export ${searchFilteredData.length} orders to CSV`}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                            {searchFilteredData.length > 0 && (
                                <span className="ml-1 text-xs opacity-70">
                                    ({searchFilteredData.length})
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* Results summary */}
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground">
                            {apiLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                    Loading...
                                </div>
                            ) : (
                                <>
                                    {searchFilteredData.length} of {pagination.total} orders
                                    {hasActiveFilters && " (filtered)"}
                                </>
                            )}
                        </div>
                        {!apiLoading && pagination.total > searchFilteredData.length && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={loadAllRecords}
                                className="text-xs h-6 px-2"
                            >
                                Load All ({pagination.total})
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop Dropdown Filters */}
            {!isMobile && filtersOpen && (
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Filter Orders
                            </CardTitle>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={resetFilters}>
                                    <X className="h-4 w-4 mr-1" />
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {/* Date Range Picker */}
                            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDateRange?.from ? (
                                            selectedDateRange.to ? (
                                                <>
                                                    {selectedDateRange.from.toLocaleDateString()} - {selectedDateRange.to.toLocaleDateString()}
                                                </>
                                            ) : (
                                                selectedDateRange.from.toLocaleDateString()
                                            )
                                        ) : (
                                            "Pick a date range"
                                        )}
                                        {(selectedDateRange?.from || selectedDateRange?.to) && (
                                            <X 
                                                className="ml-2 h-3 w-3 cursor-pointer" 
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedDateRange(undefined)
                                                    clearFilter('dateRange')
                                                }}
                                            />
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="range"
                                        selected={selectedDateRange}
                                        onSelect={handleCalendarSelect}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>

                            {/* Categories Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <Tag className="mr-2 h-4 w-4" />
                                        Categories
                                        {filters.categories.length > 0 && (
                                            <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                                                {filters.categories.length}
                                            </Badge>
                                        )}
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                                    <DropdownMenuLabel>Select Categories</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {uniqueCategories.map(category => (
                                        <div key={category} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-muted/50 cursor-pointer" onClick={() => handleCategoryToggle(category)}>
                                            <input
                                                type="checkbox"
                                                checked={filters.categories.includes(category)}
                                                onChange={() => handleCategoryToggle(category)}
                                                className="rounded"
                                            />
                                            <span className="text-sm">{category}</span>
                                        </div>
                                    ))}
                                    {filters.categories.length > 0 && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <div className="px-2 py-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => clearFilter('categories')}
                                                    className="w-full justify-start text-xs"
                                                >
                                                    Clear all categories
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Sources Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <Globe className="mr-2 h-4 w-4" />
                                        Sources
                                        {filters.sources.length > 0 && (
                                            <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                                                {filters.sources.length}
                                            </Badge>
                                        )}
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuLabel>Select Sources</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {uniqueSources.map(source => (
                                        <div key={source} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-muted/50 cursor-pointer" onClick={() => handleSourceToggle(source)}>
                                            <input
                                                type="checkbox"
                                                checked={filters.sources.includes(source)}
                                                onChange={() => handleSourceToggle(source)}
                                                className="rounded"
                                            />
                                            <span className="text-sm">{source}</span>
                                        </div>
                                    ))}
                                    {filters.sources.length > 0 && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <div className="px-2 py-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => clearFilter('sources')}
                                                    className="w-full justify-start text-xs"
                                                >
                                                    Clear all sources
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Locations Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <MapPin className="mr-2 h-4 w-4" />
                                        Locations
                                        {filters.geo.length > 0 && (
                                            <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                                                {filters.geo.length}
                                            </Badge>
                                        )}
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                                    <DropdownMenuLabel>Select Locations</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {uniqueGeoLocations.map(geo => (
                                        <div key={geo} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-muted/50 cursor-pointer" onClick={() => handleGeoToggle(geo)}>
                                            <input
                                                type="checkbox"
                                                checked={filters.geo.includes(geo)}
                                                onChange={() => handleGeoToggle(geo)}
                                                className="rounded"
                                            />
                                            <span className="text-sm truncate">{geo}</span>
                                        </div>
                                    ))}
                                    {filters.geo.length > 0 && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <div className="px-2 py-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => clearFilter('geo')}
                                                    className="w-full justify-start text-xs"
                                                >
                                                    Clear all locations
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Active Filters Summary */}
                        {hasActiveFilters && (
                            <div className="mt-4 pt-4 border-t">
                                <div className="text-sm font-medium mb-2">Active Filters:</div>
                                <div className="flex flex-wrap gap-2">
                                    {filters.categories.map(category => (
                                        <Badge key={category} variant="secondary" className="gap-1">
                                            {category}
                                            <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleCategoryToggle(category)}
                                            />
                                        </Badge>
                                    ))}
                                    {filters.sources.map(source => (
                                        <Badge key={source} variant="secondary" className="gap-1">
                                            {source}
                                            <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleSourceToggle(source)}
                                            />
                                        </Badge>
                                    ))}
                                    {filters.geo.map(geo => (
                                        <Badge key={geo} variant="secondary" className="gap-1">
                                            {geo}
                                            <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleGeoToggle(geo)}
                                            />
                                        </Badge>
                                    ))}
                                    {(filters.dateRange.start || filters.dateRange.end) && (
                                        <Badge variant="secondary" className="gap-1">
                                            Date: {filters.dateRange.start || '...'} - {filters.dateRange.end || '...'}
                                            <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => clearFilter('dateRange')}
                                            />
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Mobile Tabbed Filters */}
            {isMobile && filtersOpen && (
                <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Filter Orders
                            </CardTitle>
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={resetFilters}>
                                    <X className="h-4 w-4 mr-1" />
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Date Range for Mobile */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <CalendarIcon className="h-4 w-4" />
                                Date Range
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">From</label>
                                    <Input
                                        type="date"
                                        value={filters.dateRange.start || ""}
                                        onChange={(e) => handleDateRangeChange('start', e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">To</label>
                                    <Input
                                        type="date"
                                        value={filters.dateRange.end || ""}
                                        onChange={(e) => handleDateRangeChange('end', e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tabbed Filters for Mobile */}
                        <Tabs defaultValue="categories" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="categories" className="text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    Categories
                                    {filters.categories.length > 0 && (
                                        <span className="ml-1 bg-primary text-primary-foreground rounded-full text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                                            {filters.categories.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="sources" className="text-xs">
                                    <Globe className="h-3 w-3 mr-1" />
                                    Sources
                                    {filters.sources.length > 0 && (
                                        <span className="ml-1 bg-primary text-primary-foreground rounded-full text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                                            {filters.sources.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="locations" className="text-xs">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    Locations
                                    {filters.geo.length > 0 && (
                                        <span className="ml-1 bg-primary text-primary-foreground rounded-full text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                                            {filters.geo.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="categories" className="space-y-3 mt-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {uniqueCategories.map(category => (
                                        <label key={category} className="flex items-center space-x-2 p-3 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={filters.categories.includes(category)}
                                                onChange={() => handleCategoryToggle(category)}
                                                className="rounded"
                                            />
                                            <span className="text-sm truncate">{category}</span>
                                        </label>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="sources" className="space-y-3 mt-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {uniqueSources.map(source => (
                                        <label key={source} className="flex items-center space-x-2 p-3 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={filters.sources.includes(source)}
                                                onChange={() => handleSourceToggle(source)}
                                                className="rounded"
                                            />
                                            <span className="text-sm">{source}</span>
                                        </label>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="locations" className="space-y-3 mt-4">
                                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                                    {uniqueGeoLocations.map(geo => (
                                        <label key={geo} className="flex items-center space-x-2 p-3 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={filters.geo.includes(geo)}
                                                onChange={() => handleGeoToggle(geo)}
                                                className="rounded"
                                            />
                                            <span className="text-sm truncate">{geo}</span>
                                        </label>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Active Filters Summary for Mobile */}
                        {hasActiveFilters && (
                            <div className="pt-4 border-t">
                                <div className="text-sm font-medium mb-2">Active Filters:</div>
                                <div className="flex flex-wrap gap-2">
                                    {filters.categories.map(category => (
                                        <Badge key={category} variant="secondary" className="gap-1">
                                            {category}
                                            <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleCategoryToggle(category)}
                                            />
                                        </Badge>
                                    ))}
                                    {filters.sources.map(source => (
                                        <Badge key={source} variant="secondary" className="gap-1">
                                            {source}
                                            <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleSourceToggle(source)}
                                            />
                                        </Badge>
                                    ))}
                                    {filters.geo.map(geo => (
                                        <Badge key={geo} variant="secondary" className="gap-1">
                                            {geo}
                                            <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => handleGeoToggle(geo)}
                                            />
                                        </Badge>
                                    ))}
                                    {(filters.dateRange.start || filters.dateRange.end) && (
                                        <Badge variant="secondary" className="gap-1">
                                            Date: {filters.dateRange.start || '...'} - {filters.dateRange.end || '...'}
                                            <X 
                                                className="h-3 w-3 cursor-pointer" 
                                                onClick={() => clearFilter('dateRange')}
                                            />
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}



            {/* Error Display */}
            {apiError && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                    <strong>Error loading orders:</strong> {apiError}
                </div>
            )}

            {/* Mobile-friendly table container */}
            <div className="overflow-hidden rounded-md border">
                {isMobile ? (
                    // Mobile card view
                    <div className="divide-y">
                        {apiLoading ? (
                            <div className="p-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                    Loading orders...
                                </div>
                            </div>
                        ) : apiError ? (
                            <div className="p-6 text-center text-destructive">
                                Failed to load orders. Please try again.
                            </div>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                const order = row.original as Order
                                return (
                                    <div key={row.id} className="p-4 space-y-3 hover:bg-muted/50 transition-colors">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="font-medium text-base leading-tight">{order.customer}</div>
                                            <Badge variant="outline" className="flex-shrink-0">{order.source}</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                            <div>
                                                <span className="font-medium">Category:</span>
                                                <div className="text-foreground">{order.category}</div>
                                            </div>
                                            <div>
                                                <span className="font-medium">Location:</span>
                                                <div className="text-foreground">{order.geo}</div>
                                            </div>
                                            <div>
                                                <span className="font-medium">Date:</span>
                                                <div className="text-foreground">{order.date}</div>
                                            </div>
                                            <div>
                                                <span className="font-medium">ID:</span>
                                                <div className="text-xs font-mono text-foreground">{order.id}</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="p-6 text-center">
                                No results found.
                            </div>
                        )}
                    </div>
                ) : (
                    // Desktop table view
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {apiLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                                Loading orders...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : apiError ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                                            Failed to load orders. Please try again.
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No results found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <DataTablePagination table={table} />
        </div>
    )
}