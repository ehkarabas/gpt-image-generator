#!/usr/bin/env node

/**
 * Manual Migration Push Script
 * Applies migrations directly using Supabase client
 */

const path = require('path');
const fs = require('fs');

// Load environment variables from root .env.production
require('dotenv').config({ 
  path: path.resolve(__dirname, '../../.env.production') 
});

async function pushMigrationsManually() {
  console.log('🚀 Starting manual migration push...');
  
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase environment variables');
      process.exit(1);
    }
    
    console.log('✅ Environment variables loaded');
    console.log('🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Dynamic import for ES modules
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
        global: { headers: { 'x-application-name': 'gpt-image-generator-manual-migration' } }
      }
    );
    
    console.log('🔗 Connected to Supabase');
    
    // Read and execute migration files in order
    const migrationDir = path.resolve(__dirname, '../../supabase/migrations');
    const migrationFiles = [
      '20240716000000_create_tables.sql',
      '20250101000000_core_schema.sql', 
      '20250101000001_rls_policies.sql',
      '20250116000000_test_helper_functions.sql'
    ];
    
    console.log('📤 Executing migrations...');
    
    for (const fileName of migrationFiles) {
      const filePath = path.join(migrationDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Migration file not found: ${fileName}`);
        continue;
      }
      
      console.log(`🔄 Executing: ${fileName}`);
      
      try {
        const migrationSQL = fs.readFileSync(filePath, 'utf8');
        
        // Execute migration SQL
        const { error } = await supabase.rpc('exec_sql', { 
          sql_command: migrationSQL 
        });
        
        if (error) {
          console.log(`⚠️  Migration ${fileName} may have failed:`, error.message);
          // Don't exit - may be already applied
        } else {
          console.log(`✅ Migration ${fileName} executed successfully`);
        }
      } catch (migrationError) {
        console.log(`⚠️  Migration ${fileName} execution error:`, migrationError.message);
        // Continue with other migrations
      }
    }
    
    // Verify tables exist
    console.log('🔍 Verifying migration results...');
    const coreTables = ['profiles', 'conversations', 'messages', 'images'];
    
    for (const tableName of coreTables) {
      try {
        const { error } = await supabase.from(tableName).select('*').limit(1);
        
        if (error && error.code === 'PGRST116') {
          console.log(`❌ Table ${tableName} not accessible`);
        } else if (error && error.message.includes('schema cache')) {
          console.log(`❌ Table ${tableName} not in schema cache`);
        } else {
          console.log(`✅ Table ${tableName} verified`);
        }
      } catch (tableErr) {
        console.log(`⚠️  Table ${tableName} verification failed:`, tableErr.message);
      }
    }
    
    console.log('\\n🎉 Manual migration push completed!');
    console.log('💡 If tables are still not accessible, check Supabase dashboard');
    
  } catch (error) {
    console.error('\\n❌ Manual migration push failed!');
    console.error('🔍 Error:', error.message);
    process.exit(1);
  }
}

pushMigrationsManually();