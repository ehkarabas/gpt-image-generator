#!/usr/bin/env node

/**
 * Apply FK removal migration using Supabase CLI
 */

const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: '.env.production' });

async function applyMigration() {
  const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
  const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
  
  if (!PROJECT_REF || !ACCESS_TOKEN) {
    console.error('❌ SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN not found in .env.production');
    process.exit(1);
  }

  console.log('📊 Applying migration using Supabase CLI...');
  console.log(`   Project: ${PROJECT_REF}`);

  try {
    // First, link to the remote project
    console.log('🔗 Linking to remote project...');
    execSync(
      `npx supabase link --project-ref ${PROJECT_REF}`,
      { 
        stdio: 'inherit',
        env: { ...process.env, SUPABASE_ACCESS_TOKEN: ACCESS_TOKEN }
      }
    );

    // Push the migration
    console.log('🚀 Pushing migration to remote database...');
    execSync(
      `npx supabase db push --include-all`,
      { 
        stdio: 'inherit',
        env: { ...process.env, SUPABASE_ACCESS_TOKEN: ACCESS_TOKEN }
      }
    );

    console.log('✅ Migration applied successfully');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration();
