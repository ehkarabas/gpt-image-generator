#!/usr/bin/env node

const path = require('path');

// Load environment variables from root .env.production
require('dotenv').config({ 
  path: path.resolve(__dirname, '../../.env.production') 
});

console.log('🔍 Migration Environment Test:');
console.log('SUPABASE_PROJECT_REF:', process.env.SUPABASE_PROJECT_REF ? 'LOADED' : 'MISSING');
console.log('SUPABASE_ACCESS_TOKEN:', process.env.SUPABASE_ACCESS_TOKEN ? 'LOADED' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'LOADED' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'LOADED' : 'MISSING');

if (process.env.SUPABASE_PROJECT_REF && process.env.SUPABASE_ACCESS_TOKEN) {
  console.log('✅ All migration environment variables loaded successfully');
  console.log('🌐 Project REF:', process.env.SUPABASE_PROJECT_REF);
} else {
  console.log('❌ Migration environment variables not loaded properly');
  process.exit(1);
}