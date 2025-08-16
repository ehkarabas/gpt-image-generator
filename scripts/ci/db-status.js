#!/usr/bin/env node

/**
 * Database Status Checker
 * Checks both local and remote database status
 */

const path = require('path');

// Load environment variables from root .env.production  
require('dotenv').config({ 
  path: path.resolve(__dirname, '../../.env.production') 
});

async function checkDatabaseStatus() {
  console.log('🔍 Database Status Check');
  console.log('========================\n');
  
  try {
    console.log('📊 ENVIRONMENT VARIABLES:');
    console.log('Local URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1') ? 'LOCAL' : 'REMOTE');
    console.log('Production URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Project REF:', process.env.SUPABASE_PROJECT_REF);
    console.log('');
    
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    
    // Test remote connection
    console.log('🌐 REMOTE DATABASE STATUS:');
    const remoteSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
        global: { headers: { 'x-application-name': 'database-status-check' } }
      }
    );
    
    // Check remote tables
    try {
      const { data: remoteTables, error: remoteError } = await remoteSupabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (remoteError) {
        console.log('❌ Remote database query failed:', remoteError.message);
      } else {
        console.log('✅ Remote database connected');
        console.log('📋 Remote tables:', remoteTables?.map(t => t.table_name).join(', ') || 'none');
      }
    } catch (remoteErr) {
      console.log('❌ Remote database connection failed:', remoteErr.message);
    }
    
    console.log('');
    
    // Test local connection (if different from remote)
    const localUrl = 'http://127.0.0.1:54321';
    const localAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL !== localUrl) {
      console.log('🏠 LOCAL DATABASE STATUS:');
      const localSupabase = createClient(localUrl, localAnonKey, {
        auth: { persistSession: false },
        global: { headers: { 'x-application-name': 'local-database-status-check' } }
      });
      
      try {
        const { data: localTables, error: localError } = await localSupabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
        
        if (localError) {
          console.log('❌ Local database not running or accessible:', localError.message);
          console.log('💡 Start local Supabase: npm run supabase:start');
        } else {
          console.log('✅ Local database connected');
          console.log('📋 Local tables:', localTables?.map(t => t.table_name).join(', ') || 'none');
        }
      } catch (localErr) {
        console.log('❌ Local database not running:', localErr.message);
        console.log('💡 Start local Supabase: npm run supabase:start');
      }
    } else {
      console.log('ℹ️  Currently using local database in production config');
    }
    
    console.log('');
    console.log('🔗 DATABASE CONNECTIONS:');
    console.log('Remote Dashboard:', `https://supabase.com/dashboard/project/${process.env.SUPABASE_PROJECT_REF}`);
    console.log('Local Dashboard:', 'http://127.0.0.1:54323 (if running)');
    
  } catch (error) {
    console.error('❌ Database status check failed:', error.message);
  }
}

checkDatabaseStatus();