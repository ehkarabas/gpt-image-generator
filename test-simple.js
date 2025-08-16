#!/usr/bin/env node

const path = require('path');

// Load environment variables from root .env.production
require('dotenv').config({ 
  path: path.resolve(__dirname, '.env.production') 
});

console.log('Simple Environment Test:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'LOADED' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'LOADED' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'LOADED' : 'MISSING');

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('✅ Environment variables loaded successfully from .env.production');
  console.log('🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
} else {
  console.log('❌ Environment variables not loaded properly');
}
