"use client"

import { Order } from "@/types/order-type"
import { ColumnDef } from "@tanstack/react-table"



export const columns: ColumnDef<Order>[] = [
    {
        accessorKey: "id",
        header: "ID",
    },
    {
        accessorKey: "customer",
        header: "Customer",
    },
    {
        accessorKey: "category",
        header: "Category",
    },
    {
        accessorKey: "source",
        header: "Source",
    },
    {
        accessorKey: "geo",
        header: "Geo",
    },
    {
        accessorKey: "date",
        header: "Date",
    },

]