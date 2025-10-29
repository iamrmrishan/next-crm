-- Create orders table with optimized schema and indexes
-- Migration: 001_create_orders_table
-- Created: 2025-01-01

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer TEXT NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('Online', 'In-Store', 'App', 'Phone')),
    geo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
CREATE INDEX IF NOT EXISTS idx_orders_category ON orders(category);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_geo ON orders(geo);
CREATE INDEX IF NOT EXISTS idx_orders_composite ON orders(date, category, source);
CREATE INDEX IF NOT EXISTS idx_orders_date_desc ON orders(date DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for data protection
-- Policy: Allow all operations for authenticated users (can be refined based on requirements)
CREATE POLICY "Enable all operations for authenticated users" ON orders
    FOR ALL USING (auth.role() = 'authenticated');

-- Policy: Allow read access for anonymous users (for public dashboards if needed)
CREATE POLICY "Enable read access for anonymous users" ON orders
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT ALL ON orders TO authenticated;
GRANT SELECT ON orders TO anon;

-- Add comments for documentation
COMMENT ON TABLE orders IS 'Customer orders data with optimized indexing for filtering and analytics';
COMMENT ON COLUMN orders.id IS 'Unique order identifier';
COMMENT ON COLUMN orders.customer IS 'Customer name';
COMMENT ON COLUMN orders.category IS 'Product category';
COMMENT ON COLUMN orders.date IS 'Order date';
COMMENT ON COLUMN orders.source IS 'Order source channel (Online, In-Store, App, Phone)';
COMMENT ON COLUMN orders.geo IS 'Geographic location';
COMMENT ON COLUMN orders.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN orders.updated_at IS 'Record last update timestamp';