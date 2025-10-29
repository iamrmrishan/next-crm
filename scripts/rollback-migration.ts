#!/usr/bin/env tsx
/**
 * Migration Rollback Script
 * Provides rollback capabilities for the Supabase migration
 * 
 * Usage: npx tsx scripts/rollback-migration.ts [--confirm]
 */

import { createClient } from '@supabase/supabase-js';

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

interface RollbackResult {
  success: boolean;
  deletedCount: number;
  errors: string[];
  duration: number;
  timestamp: string;
}

/**
 * Gets current data count in the orders table
 */
async function getCurrentDataCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error getting data count:', error.message);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('❌ Error getting data count:', error);
    return 0;
  }
}

/**
 * Clears all data from the orders table
 */
async function clearOrdersTable(): Promise<RollbackResult> {
  const startTime = Date.now();
  const result: RollbackResult = {
    success: false,
    deletedCount: 0,
    errors: [],
    duration: 0,
    timestamp: new Date().toISOString()
  };

  try {
    console.log('🗑️  Clearing orders table...');

    // Get count before deletion
    const countBefore = await getCurrentDataCount();
    
    if (countBefore === 0) {
      console.log('ℹ️  Orders table is already empty.');
      result.success = true;
      result.duration = Date.now() - startTime;
      return result;
    }

    // Delete all records
    const { error } = await supabase
      .from('orders')
      .delete()
      .neq('id', ''); // This will match all records

    if (error) {
      result.errors.push(`Failed to clear table: ${error.message}`);
      result.duration = Date.now() - startTime;
      return result;
    }

    // Verify deletion
    const countAfter = await getCurrentDataCount();
    result.deletedCount = countBefore - countAfter;
    result.success = countAfter === 0;
    result.duration = Date.now() - startTime;

    if (!result.success) {
      result.errors.push(`Incomplete deletion: ${countAfter} records remain`);
    }

    return result;
  } catch (error) {
    result.errors.push(`Rollback failed: ${error instanceof Error ? error.message : String(error)}`);
    result.duration = Date.now() - startTime;
    return result;
  }
}

/**
 * Drops the orders table completely (more aggressive rollback)
 */
async function dropOrdersTable(): Promise<RollbackResult> {
  const startTime = Date.now();
  const result: RollbackResult = {
    success: false,
    deletedCount: 0,
    errors: [],
    duration: 0,
    timestamp: new Date().toISOString()
  };

  try {
    console.log('💥 Dropping orders table completely...');

    // Note: This requires direct SQL execution which may not be available with the anon key
    // This is a placeholder for the more aggressive rollback option
    console.log('⚠️  Table dropping requires database admin access.');
    console.log('   Please run the following SQL manually in your Supabase dashboard:');
    console.log('   DROP TABLE IF EXISTS orders CASCADE;');
    
    result.errors.push('Manual intervention required for table dropping');
    result.duration = Date.now() - startTime;
    return result;
  } catch (error) {
    result.errors.push(`Table drop failed: ${error instanceof Error ? error.message : String(error)}`);
    result.duration = Date.now() - startTime;
    return result;
  }
}

/**
 * Main rollback function
 */
async function main() {
  const args = process.argv.slice(2);
  const isConfirmed = args.includes('--confirm');
  const shouldDropTable = args.includes('--drop-table');

  console.log('🔄 Supabase Migration Rollback Tool\n');

  // Get current state
  const currentCount = await getCurrentDataCount();
  console.log(`📊 Current orders in database: ${currentCount}`);

  if (currentCount === 0) {
    console.log('ℹ️  No data to rollback. Database is already empty.');
    process.exit(0);
  }

  // Safety confirmation
  if (!isConfirmed) {
    console.log('\n⚠️  WARNING: This will permanently delete all order data from Supabase!');
    console.log('   Make sure you have a backup if needed.');
    console.log('   To proceed, run: npx tsx scripts/rollback-migration.ts --confirm');
    
    if (shouldDropTable) {
      console.log('   To drop the entire table: npx tsx scripts/rollback-migration.ts --confirm --drop-table');
    }
    
    process.exit(1);
  }

  console.log('\n🚨 CONFIRMED: Proceeding with rollback...\n');

  let rollbackResult: RollbackResult;

  if (shouldDropTable) {
    rollbackResult = await dropOrdersTable();
  } else {
    rollbackResult = await clearOrdersTable();
  }

  // Display results
  console.log('\n📊 Rollback Results:');
  console.log(`  Success: ${rollbackResult.success ? '✅' : '❌'}`);
  console.log(`  Deleted: ${rollbackResult.deletedCount} orders`);
  console.log(`  Duration: ${rollbackResult.duration}ms`);
  console.log(`  Timestamp: ${rollbackResult.timestamp}`);

  if (rollbackResult.errors.length > 0) {
    console.log('\n❌ Errors:');
    rollbackResult.errors.forEach(error => console.log(`  - ${error}`));
  }

  // Verify rollback
  const finalCount = await getCurrentDataCount();
  console.log(`\n🔍 Final verification: ${finalCount} orders remaining in database`);

  if (rollbackResult.success && finalCount === 0) {
    console.log('\n🎉 Rollback completed successfully!');
    console.log('The orders table has been cleared. You can now re-run the migration if needed.');
  } else if (!rollbackResult.success) {
    console.log('\n❌ Rollback failed. Please check the errors above.');
  }

  // Exit with appropriate code
  process.exit(rollbackResult.success ? 0 : 1);
}

// Run rollback
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Rollback failed:', error);
    process.exit(1);
  });
}

export { clearOrdersTable, dropOrdersTable };