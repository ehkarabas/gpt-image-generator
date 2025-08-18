#!/usr/bin/env node

const { Client } = require('pg')
const path = require('path')
const fs = require('fs')

const files = [
  'supabase/migrations/20250117000000_fix_trigger_syntax.sql',
  'supabase/migrations/20250118000000_fix_profile_race_condition.sql',
  'supabase/migrations/20250118010000_conversations_fk_to_auth_users.sql',
]

function loadProdEnv() {
  const envPath = path.join(process.cwd(), '.env.production')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.production not found')
    process.exit(1)
  }
  require('dotenv').config({ path: envPath })
  if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    console.error('❌ DATABASE_URL or DIRECT_URL missing')
    process.exit(1)
  }
}

async function main() {
  loadProdEnv()
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
  console.log('🔌 Using connection:', process.env.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL')
  const client = new Client({ connectionString })
  await client.connect()
  try {
    for (const file of files) {
      if (!fs.existsSync(file)) {
        console.warn('⚠️  Missing SQL file, skipping:', file)
        continue
      }
      console.log('🟢 Executing SQL on remote:', file)
      const sql = fs.readFileSync(file, 'utf8')
      await client.query(sql)
    }
    console.log('✅ Executed selected SQL files on remote')
  } finally {
    await client.end()
  }
}

main().catch(err => { console.error('❌ exec-sql-remote failed:', err.message); process.exit(1) })


