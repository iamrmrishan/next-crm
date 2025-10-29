import { ColumnDef } from "@tanstack/react-table";

export type Order = {
    id: string;
    customer: string;
    category: string;
    date: string; // ISO date format (YYYY-MM-DD)
    source: 'Online' | 'In-Store' | 'App' | 'Phone';
    geo: string;
};

