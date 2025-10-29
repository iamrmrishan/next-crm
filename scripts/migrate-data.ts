#!/usr/bin/env tsx
/**
 * Data Migration Script
 * Transfers existing order data from local files to Supabase database
 * 
 * Usage: npx tsx scripts/migrate-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import { orders } from '../data/data';
import { Order } from '../types/order-type';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  duration: number;
  timestamp: string;
}

/**
 * Validates order data before migration
 */
function validateOrderData(orders: Order[]): { valid: Order[]; invalid: { order: Order; errors: string[] }[] } {
  const valid: Order[] = [];
  const invalid: { order: Order; errors: string[] }[] = [];

  orders.forEach(order => {
    const errors: string[] = [];

    // Validate required fields
    if (!order.id || typeof order.id !== 'string') {
      errors.push('Invalid or missing id');
    }
    if (!order.customer || typeof order.customer !== 'string') {
      errors.push('Invalid or missing customer');
    }
    if (!order.category || typeof order.category !== 'string') {
      errors.push('Invalid or missing category');
    }
    if (!order.date || typeof order.date !== 'string') {
      errors.push('Invalid or missing date');
    }
    if (!order.source || !['Online', 'In-Store', 'App', 'Phone'].includes(order.source)) {
      errors.push('Invalid source - must be Online, In-Store, App, or Phone');
    }
    if (!order.geo || typeof order.geo !== 'string') {
      errors.push('Invalid or missing geo');
    }

    // Validate date format (YYYY-MM-DD)
    if (order.date && !/^\d{4}-\d{2}-\d{2}$/.test(order.date)) {
      errors.push('Invalid date format - must be YYYY-MM-DD');
    }

    if (errors.length === 0) {
      valid.push(order);
    } else {
      invalid.push({ order, errors });
    }
  });

  return { valid, invalid };
}

/**
 * Checks if data already exists in the database
 */
async function checkExistingData(): Promise<{ exists: boolean; count: number }> {
  try {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error checking existing data:', error.message);
      return { exists: false, count: 0 };
    }

    return { exists: (count || 0) > 0, count: count || 0 };
  } catch (error) {
    console.error('❌ Error checking existing data:', error);
    return { exists: false, count: 0 };
  }
}

/**
 * Migrates orders data to Supabase in batches
 */
async function migrateOrders(orders: Order[], batchSize: number = 50): Promise<MigrationResult> {
  const startTime = Date.now();
  const result: MigrationResult = {
    success: false,
    migratedCount: 0,
    errors: [],
    duration: 0,
    timestamp: new Date().toISOString()
  };

  try {
    console.log(`📦 Starting migration of ${orders.length} orders in batches of ${batchSize}...`);

    // Process in batches to avoid overwhelming the database
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(orders.length / batchSize);

      console.log(`📤 Processing batch ${batchNumber}/${totalBatches} (${batch.length} orders)...`);

      const { data, error } = await supabase
        .from('orders')
        .insert(batch)
        .select();

      if (error) {
        const errorMsg = `Batch ${batchNumber} failed: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
        
        // Continue with next batch instead of failing completely
        continue;
      }

      result.migratedCount += data?.length || 0;
      console.log(`✅ Batch ${batchNumber} completed: ${data?.length || 0} orders migrated`);
    }

    result.success = result.migratedCount > 0;
    result.duration = Date.now() - startTime;

    return result;
  } catch (error) {
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
    result.duration = Date.now() - startTime;
    return result;
  }
}

/**
 * Verifies migrated data integrity
 */
async function verifyMigration(expectedCount: number): Promise<{ success: boolean; actualCount: number; errors: string[] }> {
  try {
    console.log('🔍 Verifying migration integrity...');

    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return { success: false, actualCount: 0, errors: [error.message] };
    }

    const actualCount = count || 0;
    const success = actualCount === expectedCount;

    if (!success) {
      return {
        success: false,
        actualCount,
        errors: [`Count mismatch: expected ${expectedCount}, got ${actualCount}`]
      };
    }

    // Sample a few records to verify data integrity
    const { data: sampleData, error: sampleError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);

    if (sampleError) {
      return { success: false, actualCount, errors: [sampleError.message] };
    }

    console.log('📋 Sample migrated data:');
    sampleData?.forEach(order => {
      console.log(`  - ${order.id}: ${order.customer} (${order.category}, ${order.date})`);
    });

    return { success: true, actualCount, errors: [] };
  } catch (error) {
    return {
      success: false,
      actualCount: 0,
      errors: [`Verification failed: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting Supabase data migration...\n');

  // Check if data already exists
  const { exists, count } = await checkExistingData();
  if (exists) {
    console.log(`⚠️  Database already contains ${count} orders.`);
    console.log('Do you want to continue? This will add duplicate data.');
    console.log('Consider clearing the table first or modifying the script to handle duplicates.\n');
    
    // For now, we'll continue but log a warning
    console.log('⚠️  Continuing with migration - this may create duplicates...\n');
  }

  // Validate data
  console.log('🔍 Validating order data...');
  const { valid, invalid } = validateOrderData(orders);

  if (invalid.length > 0) {
    console.log(`❌ Found ${invalid.length} invalid orders:`);
    invalid.forEach(({ order, errors }) => {
      console.log(`  - Order ${order.id}: ${errors.join(', ')}`);
    });
    console.log('');
  }

  if (valid.length === 0) {
    console.error('❌ No valid orders to migrate. Exiting.');
    process.exit(1);
  }

  console.log(`✅ ${valid.length} valid orders ready for migration\n`);

  // Perform migration
  const migrationResult = await migrateOrders(valid);

  // Display results
  console.log('\n📊 Migration Results:');
  console.log(`  Success: ${migrationResult.success ? '✅' : '❌'}`);
  console.log(`  Migrated: ${migrationResult.migratedCount}/${valid.length} orders`);
  console.log(`  Duration: ${migrationResult.duration}ms`);
  console.log(`  Timestamp: ${migrationResult.timestamp}`);

  if (migrationResult.errors.length > 0) {
    console.log('\n❌ Errors:');
    migrationResult.errors.forEach(error => console.log(`  - ${error}`));
  }

  // Verify migration
  if (migrationResult.success) {
    const verification = await verifyMigration(migrationResult.migratedCount);
    console.log('\n🔍 Verification Results:');
    console.log(`  Success: ${verification.success ? '✅' : '❌'}`);
    console.log(`  Records in DB: ${verification.actualCount}`);

    if (verification.errors.length > 0) {
      console.log('\n❌ Verification Errors:');
      verification.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (verification.success) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('Your order data is now available in Supabase.');
    }
  }

  // Exit with appropriate code
  process.exit(migrationResult.success ? 0 : 1);
}

// Run migration
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
}

export { migrateOrders, validateOrderData, verifyMigration };