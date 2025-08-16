#!/usr/bin/env node

/**
 * Direct Table Creation Script
 * Creates tables directly via Supabase client instead of migration files
 */

const path = require('path');

// Load environment variables from root .env.production
require('dotenv').config({ 
  path: path.resolve(__dirname, '../../.env.production') 
});

async function createTablesDirectly() {
  console.log('🚀 Starting direct table creation...');
  
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase environment variables');
      process.exit(1);
    }
    
    console.log('✅ Environment variables loaded');
    
    // Dynamic import for ES modules
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
        global: { headers: { 'x-application-name': 'gpt-image-generator-table-creation' } }
      }
    );
    
    console.log('🔗 Connected to Supabase');
    
    // Check if tables already exist
    console.log('🔍 Checking existing tables...');
    const coreTables = ['profiles', 'conversations', 'messages', 'images'];
    
    for (const tableName of coreTables) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        
        if (!error) {
          console.log(`✅ Table ${tableName} already exists and accessible`);
        } else if (error.code === 'PGRST116') {
          console.log(`❌ Table ${tableName} does not exist`);
        } else if (error.message.includes('schema cache')) {
          console.log(`❌ Table ${tableName} not in schema cache`);
        } else {
          console.log(`⚠️  Table ${tableName} status unknown:`, error.message);
        }
      } catch (tableErr) {
        console.log(`❌ Table ${tableName} check failed:`, tableErr.message);
      }
    }
    
    console.log('\\n💡 Tables status checked');
    console.log('🎯 To create missing tables:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Run the migration files manually:');
    console.log('      - 20240716000000_create_tables.sql');
    console.log('      - 20250101000000_core_schema.sql');
    console.log('      - 20250101000001_rls_policies.sql');
    console.log('      - 20250116000000_test_helper_functions.sql');
    console.log('\\n🌐 Supabase Dashboard: https://supabase.com/dashboard/project/feeyvzojjjmnojvwcgoj');
    
    // Test basic connectivity one more time
    console.log('\\n🔍 Final connectivity test...');
    try {
      // Try a simple query that should always work
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(5);
      
      if (error) {
        console.log('⚠️  Schema query failed:', error.message);
      } else {
        console.log('✅ Database connectivity confirmed');
        console.log('📋 Existing public tables:', data?.map(t => t.table_name).join(', ') || 'none');
      }
    } catch (connectErr) {
      console.log('⚠️  Connectivity test failed:', connectErr.message);
    }
    
    console.log('\\n✅ Direct table check completed!');
    
  } catch (error) {
    console.error('\\n❌ Direct table creation check failed!');
    console.error('🔍 Error:', error.message);
    process.exit(1);
  }
}

createTablesDirectly();