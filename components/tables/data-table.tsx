"use client"

import * as React from "react"
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    ColumnDef,
    SortingState,
    ColumnFiltersState,
    getSortedRowModel,
    getFilteredRowModel,
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
import { ChevronDown } from "lucide-react"
import { DataTablePagination } from "./data-table-pagination"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    title?: string
    description?: string
}

export function DataTable<TData, TValue>({
    columns,
    data,
    title,
    description,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [selectedColumn, setSelectedColumn] = React.useState<string>("date")
    const [filterValue, setFilterValue] = React.useState<string>("")

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    })

    // Update filter when input changes
    const handleFilterChange = (value: string) => {
        setFilterValue(value)
        table.getColumn(selectedColumn)?.setFilterValue(value)
    }

    // Clear old filter and set new one when column changes
    const handleColumnChange = (column: string) => {
        table.getColumn(selectedColumn)?.setFilterValue("")
        setSelectedColumn(column)
        setFilterValue("")
        table.getColumn(column)?.setFilterValue("")
    }

    return (
        <div className="space-y-4">
            {(title || description) && (
                <div className="space-y-1">
                    {title && (
                        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                    )}
                    {description && (
                        <p className="text-muted-foreground text-sm">{description}</p>
                    )}
                </div>
            )}

            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="capitalize">
                            {selectedColumn} <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Filter by column</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={selectedColumn} onValueChange={handleColumnChange}>
                            <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="category">Category</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="source">Source</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="geo">Geo</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Input
                    placeholder={`Filter by ${selectedColumn}...`}
                    value={filterValue}
                    onChange={(event) => handleFilterChange(event.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="overflow-hidden rounded-md border">
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
                        {table.getRowModel().rows?.length ? (
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
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination table={table} />
        </div>
    )
}