# Supabase Database Migration

This directory contains the database schema and migration infrastructure for migrating order data from local files to Supabase.

## Overview

The migration system provides:
- Optimized database schema with proper indexing
- Row Level Security (RLS) policies for data protection
- Data migration scripts with validation and error handling
- Rollback capabilities for safe migration management
- Verification tools to ensure data integrity

## Files Structure

```
supabase/
├── migrations/
│   └── 001_create_orders_table.sql    # Database schema and RLS policies
└── README.md                          # This documentation

scripts/
├── migrate-data.ts                    # Main migration script
├── rollback-migration.ts              # Rollback utilities
└── verify-migration.ts                # Data integrity verification
```

## Database Schema

The `orders` table includes:

### Columns
- `id` (TEXT, PRIMARY KEY) - Unique order identifier
- `customer` (TEXT, NOT NULL) - Customer name
- `category` (TEXT, NOT NULL) - Product category
- `date` (DATE, NOT NULL) - Order date
- `source` (TEXT, NOT NULL) - Order source (Online, In-Store, App, Phone)
- `geo` (TEXT, NOT NULL) - Geographic location
- `created_at` (TIMESTAMP WITH TIME ZONE) - Record creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Record last update timestamp

### Indexes
- `idx_orders_date` - Single column index on date
- `idx_orders_category` - Single column index on category
- `idx_orders_source` - Single column index on source
- `idx_orders_geo` - Single column index on geo
- `idx_orders_composite` - Composite index on (date, category, source)
- `idx_orders_date_desc` - Descending index on date for recent orders

### Row Level Security (RLS)
- Authenticated users: Full access (SELECT, INSERT, UPDATE, DELETE)
- Anonymous users: Read-only access (SELECT)

## Prerequisites

1. **Environment Variables**: Set up the following in your `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Optional, for enhanced permissions
   ```

2. **Dependencies**: Ensure you have the required packages:
   ```bash
   npm install @supabase/supabase-js
   ```

3. **TypeScript Execution**: Install tsx for running TypeScript scripts:
   ```bash
   npm install -g tsx
   # or use npx tsx for one-time execution
   ```

## Migration Process

### Step 1: Apply Database Schema

1. **Manual Application** (Recommended):
   - Copy the contents of `supabase/migrations/001_create_orders_table.sql`
   - Paste and execute in your Supabase SQL Editor
   - Verify the table and indexes are created successfully

2. **Using Supabase CLI** (Alternative):
   ```bash
   supabase db push
   ```

### Step 2: Run Data Migration

Execute the migration script to transfer data from local files:

```bash
npx tsx scripts/migrate-data.ts
```

The script will:
- Validate all order data before migration
- Process data in batches to avoid overwhelming the database
- Provide detailed progress and error reporting
- Verify data integrity after migration

### Step 3: Verify Migration

Run the verification script to ensure data integrity:

```bash
npx tsx scripts/verify-migration.ts
```

This will:
- Compare local and remote data for completeness
- Verify data integrity field by field
- Test query performance with different filters
- Generate a comprehensive report

## Migration Features

### Data Validation
- Required field validation
- Data type checking
- Date format validation (YYYY-MM-DD)
- Source value validation (Online, In-Store, App, Phone)

### Batch Processing
- Processes data in configurable batches (default: 50 records)
- Continues processing even if individual batches fail
- Provides detailed batch-level progress reporting

### Error Handling
- Comprehensive error logging
- Graceful handling of database connection issues
- Detailed error messages for troubleshooting

### Performance Optimization
- Optimized indexes for common query patterns
- Batch insertion for efficient data transfer
- Query performance testing and monitoring

## Rollback Options

If you need to rollback the migration:

### Clear Data Only
```bash
npx tsx scripts/rollback-migration.ts --confirm
```

### Drop Table Completely
```bash
npx tsx scripts/rollback-migration.ts --confirm --drop-table
```

**⚠️ Warning**: Rollback operations are destructive and cannot be undone. Make sure you have backups if needed.

## Troubleshooting

### Common Issues

1. **Environment Variables Missing**
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - For enhanced permissions, set `SUPABASE_SERVICE_ROLE_KEY`

2. **Permission Errors**
   - Verify your Supabase keys have the necessary permissions
   - Check RLS policies if you're getting access denied errors

3. **Connection Timeouts**
   - Check your internet connection
   - Verify Supabase project is active and accessible

4. **Data Validation Errors**
   - Review the validation error messages
   - Fix data issues in the source files before re-running

### Performance Considerations

- **Large Datasets**: Adjust batch size in migration script if needed
- **Slow Queries**: Monitor the performance test results and optimize indexes
- **Memory Usage**: The migration script loads data in batches to manage memory

## Security Notes

- RLS policies are enabled by default for data protection
- Anonymous users have read-only access (can be modified based on requirements)
- Service role key provides elevated permissions for migration operations
- All user inputs are validated and sanitized

## Monitoring and Maintenance

After migration:
1. Monitor query performance using the verification script
2. Review Supabase dashboard for usage metrics
3. Set up alerts for database performance issues
4. Regularly backup your data

## Next Steps

After successful migration:
1. Update your application to use Supabase instead of local data files
2. Implement API routes for data fetching
3. Add caching mechanisms for improved performance
4. Set up monitoring and alerting for production use

## Support

If you encounter issues:
1. Check the error messages and logs
2. Verify your environment configuration
3. Review the Supabase dashboard for any service issues
4. Consult the Supabase documentation for additional troubleshooting