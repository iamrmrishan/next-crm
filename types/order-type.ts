// Removed unused import

export type Order = {
    id: string;
    customer: string;
    category: string;
    date: string; // ISO date format (YYYY-MM-DD)
    source: 'Online' | 'In-Store' | 'App' | 'Phone';
    geo: string;
};

