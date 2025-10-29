#!/usr/bin/env tsx
/**
 * Migration Verification Script
 * Verifies data integrity and completeness after migration
 * 
 * Usage: npx tsx scripts/verify-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import { orders as localOrders } from '../data/data';
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

interface VerificationResult {
  success: boolean;
  totalRecords: number;
  matchingRecords: number;
  missingRecords: string[];
  extraRecords: string[];
  dataIntegrityIssues: string[];
  performanceMetrics: {
    queryTime: number;
    indexEfficiency: boolean;
  };
}

/**
 * Fetches all orders from Supabase
 */
async function fetchAllOrders(): Promise<{ data: Order[]; queryTime: number }> {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('id');

    const queryTime = Date.now() - startTime;

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return { data: data || [], queryTime };
  } catch (error) {
    throw new Error(`Database query failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Verifies data completeness by comparing local and remote data
 */
function verifyDataCompleteness(localData: Order[], remoteData: Order[]): {
  matchingRecords: number;
  missingRecords: string[];
  extraRecords: string[];
} {
  const localIds = new Set(localData.map(order => order.id));
  const remoteIds = new Set(remoteData.map(order => order.id));

  const missingRecords: string[] = [];
  const extraRecords: string[] = [];

  // Find missing records (in local but not in remote)
  localIds.forEach(id => {
    if (!remoteIds.has(id)) {
      missingRecords.push(id);
    }
  });

  // Find extra records (in remote but not in local)
  remoteIds.forEach(id => {
    if (!localIds.has(id)) {
      extraRecords.push(id);
    }
  });

  const matchingRecords = localData.length - missingRecords.length;

  return { matchingRecords, missingRecords, extraRecords };
}

/**
 * Verifies data integrity by comparing field values
 */
function verifyDataIntegrity(localData: Order[], remoteData: Order[]): string[] {
  const issues: string[] = [];
  const remoteMap = new Map(remoteData.map(order => [order.id, order]));

  localData.forEach(localOrder => {
    const remoteOrder = remoteMap.get(localOrder.id);
    
    if (!remoteOrder) {
      return; // Already handled in completeness check
    }

    // Compare each field
    if (localOrder.customer !== remoteOrder.customer) {
      issues.push(`${localOrder.id}: customer mismatch (local: "${localOrder.customer}", remote: "${remoteOrder.customer}")`);
    }
    
    if (localOrder.category !== remoteOrder.category) {
      issues.push(`${localOrder.id}: category mismatch (local: "${localOrder.category}", remote: "${remoteOrder.category}")`);
    }
    
    if (localOrder.date !== remoteOrder.date) {
      issues.push(`${localOrder.id}: date mismatch (local: "${localOrder.date}", remote: "${remoteOrder.date}")`);
    }
    
    if (localOrder.source !== remoteOrder.source) {
      issues.push(`${localOrder.id}: source mismatch (local: "${localOrder.source}", remote: "${remoteOrder.source}")`);
    }
    
    if (localOrder.geo !== remoteOrder.geo) {
      issues.push(`${localOrder.id}: geo mismatch (local: "${localOrder.geo}", remote: "${remoteOrder.geo}")`);
    }
  });

  return issues;
}

/**
 * Tests query performance with different filters
 */
async function testQueryPerformance(): Promise<{ indexEfficiency: boolean; details: string[] }> {
  const details: string[] = [];
  let indexEfficiency = true;

  try {
    // Test date range query (should use idx_orders_date)
    const dateStart = Date.now();
    const { error: dateError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('date', '2025-09-01')
      .lte('date', '2025-09-30');
    
    const dateTime = Date.now() - dateStart;
    details.push(`Date range query: ${dateTime}ms`);
    
    if (dateError) {
      details.push(`Date query error: ${dateError.message}`);
      indexEfficiency = false;
    }

    // Test category filter (should use idx_orders_category)
    const categoryStart = Date.now();
    const { error: categoryError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'Electronics');
    
    const categoryTime = Date.now() - categoryStart;
    details.push(`Category filter query: ${categoryTime}ms`);
    
    if (categoryError) {
      details.push(`Category query error: ${categoryError.message}`);
      indexEfficiency = false;
    }

    // Test composite filter (should use idx_orders_composite)
    const compositeStart = Date.now();
    const { error: compositeError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('date', '2025-10-01')
      .eq('category', 'Electronics')
      .eq('source', 'Online');
    
    const compositeTime = Date.now() - compositeStart;
    details.push(`Composite filter query: ${compositeTime}ms`);
    
    if (compositeError) {
      details.push(`Composite query error: ${compositeError.message}`);
      indexEfficiency = false;
    }

    // Performance thresholds (adjust based on your requirements)
    if (dateTime > 500 || categoryTime > 300 || compositeTime > 500) {
      indexEfficiency = false;
      details.push('⚠️  Some queries exceeded performance thresholds');
    }

  } catch (error) {
    details.push(`Performance test failed: ${error instanceof Error ? error.message : String(error)}`);
    indexEfficiency = false;
  }

  return { indexEfficiency, details };
}

/**
 * Generates a summary report of data distribution
 */
function generateDataSummary(data: Order[]): void {
  console.log('\n📈 Data Distribution Summary:');
  
  // Category distribution
  const categories = data.reduce((acc, order) => {
    acc[order.category] = (acc[order.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('  Categories:');
  Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`    ${category}: ${count} orders`);
    });

  // Source distribution
  const sources = data.reduce((acc, order) => {
    acc[order.source] = (acc[order.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('  Sources:');
  Object.entries(sources)
    .sort(([,a], [,b]) => b - a)
    .forEach(([source, count]) => {
      console.log(`    ${source}: ${count} orders`);
    });

  // Date range
  const dates = data.map(order => order.date).sort();
  console.log(`  Date Range: ${dates[0]} to ${dates[dates.length - 1]}`);
  
  // Geographic distribution (top 10)
  const geos = data.reduce((acc, order) => {
    acc[order.geo] = (acc[order.geo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('  Top Geographic Locations:');
  Object.entries(geos)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([geo, count]) => {
      console.log(`    ${geo}: ${count} orders`);
    });
}

/**
 * Main verification function
 */
async function main() {
  console.log('🔍 Starting migration verification...\n');

  try {
    // Fetch remote data
    console.log('📡 Fetching data from Supabase...');
    const { data: remoteData, queryTime } = await fetchAllOrders();
    console.log(`✅ Fetched ${remoteData.length} orders in ${queryTime}ms\n`);

    // Verify completeness
    console.log('🔢 Verifying data completeness...');
    const { matchingRecords, missingRecords, extraRecords } = verifyDataCompleteness(localOrders, remoteData);
    
    // Verify integrity
    console.log('🔍 Verifying data integrity...');
    const dataIntegrityIssues = verifyDataIntegrity(localOrders, remoteData);

    // Test performance
    console.log('⚡ Testing query performance...');
    const { indexEfficiency, details } = await testQueryPerformance();

    // Compile results
    const result: VerificationResult = {
      success: missingRecords.length === 0 && dataIntegrityIssues.length === 0,
      totalRecords: remoteData.length,
      matchingRecords,
      missingRecords,
      extraRecords,
      dataIntegrityIssues,
      performanceMetrics: {
        queryTime,
        indexEfficiency
      }
    };

    // Display results
    console.log('\n📊 Verification Results:');
    console.log(`  Overall Success: ${result.success ? '✅' : '❌'}`);
    console.log(`  Total Records: ${result.totalRecords}`);
    console.log(`  Matching Records: ${result.matchingRecords}/${localOrders.length}`);
    console.log(`  Missing Records: ${result.missingRecords.length}`);
    console.log(`  Extra Records: ${result.extraRecords.length}`);
    console.log(`  Data Integrity Issues: ${result.dataIntegrityIssues.length}`);
    console.log(`  Query Performance: ${result.performanceMetrics.indexEfficiency ? '✅' : '⚠️'}`);

    // Show details for issues
    if (result.missingRecords.length > 0) {
      console.log('\n❌ Missing Records:');
      result.missingRecords.forEach(id => console.log(`  - ${id}`));
    }

    if (result.extraRecords.length > 0) {
      console.log('\n⚠️  Extra Records (not in local data):');
      result.extraRecords.forEach(id => console.log(`  - ${id}`));
    }

    if (result.dataIntegrityIssues.length > 0) {
      console.log('\n❌ Data Integrity Issues:');
      result.dataIntegrityIssues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
      if (result.dataIntegrityIssues.length > 10) {
        console.log(`  ... and ${result.dataIntegrityIssues.length - 10} more issues`);
      }
    }

    // Performance details
    console.log('\n⚡ Performance Test Results:');
    details.forEach(detail => console.log(`  ${detail}`));

    // Data summary
    if (remoteData.length > 0) {
      generateDataSummary(remoteData);
    }

    // Final recommendations
    console.log('\n💡 Recommendations:');
    if (result.success) {
      console.log('  ✅ Migration verification passed! Your data is ready for use.');
    } else {
      console.log('  ❌ Migration verification failed. Please review the issues above.');
      if (result.missingRecords.length > 0) {
        console.log('  📝 Consider re-running the migration for missing records.');
      }
      if (result.dataIntegrityIssues.length > 0) {
        console.log('  🔧 Data integrity issues need to be resolved manually.');
      }
    }

    if (!result.performanceMetrics.indexEfficiency) {
      console.log('  ⚡ Consider optimizing database indexes for better performance.');
    }

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  }
}

// Run verification
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
}

export { verifyDataCompleteness, verifyDataIntegrity, testQueryPerformance };