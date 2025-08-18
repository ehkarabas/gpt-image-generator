#!/usr/bin/env node

/**
 * Apply FK removal migration to remote database
 */

const { Client } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.production' });

async function applyMigration() {
  const DIRECT_URL = process.env.DIRECT_URL;
  
  if (!DIRECT_URL) {
    console.error('❌ DIRECT_URL not found in .env.production');
    process.exit(1);
  }

  console.log('📊 Connecting to remote database...');
  console.log(`   Using: ${DIRECT_URL.replace(/:[^:@]+@/, ':***@')}`);

  const client = new Client({
    connectionString: DIRECT_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to remote database');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', '..', 'supabase', 'migrations', '20250119000000_remove_conversations_fk_constraint.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔧 Applying FK removal migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration applied successfully');

    // Verify FK is removed
    console.log('🔍 Verifying FK removal...');
    const fkCheckResult = await client.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'public.conversations'::regclass 
      AND contype = 'f'
    `);
    
    if (fkCheckResult.rows.length === 0) {
      console.log('✅ No foreign keys found on conversations table - success!');
    } else {
      console.log('⚠️ Foreign keys still exist:', fkCheckResult.rows);
    }

    // Check RLS policies
    console.log('🔍 Checking RLS policies...');
    const policyResult = await client.query(`
      SELECT polname 
      FROM pg_policy 
      WHERE polrelid = 'public.conversations'::regclass
    `);
    
    console.log(`✅ Found ${policyResult.rows.length} RLS policies:`, 
      policyResult.rows.map(r => r.polname).join(', '));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔒 Database connection closed');
  }
}

applyMigration();
