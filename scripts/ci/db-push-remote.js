#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

function loadProdEnv() {
  const envPath = path.join(process.cwd(), '.env.production')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.production not found. Run ci:prepare:production first.')
    process.exit(1)
  }
  const dotenv = require('dotenv')
  dotenv.config({ path: envPath })
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL missing in .env.production')
    process.exit(1)
  }
}

async function main() {
  loadProdEnv()
  const dbUrl = process.env.DATABASE_URL
  console.log('🔄 Pushing migrations to remote database...')

  const args = ['supabase', 'db', 'push', '--db-url', dbUrl]
  const child = spawn('npx', args, { stdio: 'inherit', shell: true })
  child.on('exit', (code) => {
    if (code !== 0) {
      console.error('❌ supabase db push failed with code', code)
      process.exit(code || 1)
    }
    console.log('✅ Remote migrations applied')
    process.exit(0)
  })
}

main().catch((err) => {
  console.error('❌ db-push-remote error:', err)
  process.exit(1)
})


