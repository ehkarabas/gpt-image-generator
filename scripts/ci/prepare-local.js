const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', '..')
const frontendDir = path.join(root, 'frontend')
const rootEnvLocal = path.join(root, '.env.local')
const feEnvLocal = path.join(frontendDir, '.env.local')
const feEnv = path.join(frontendDir, '.env')

// Prepare local env for Next dev and Playwright
if (!fs.existsSync(rootEnvLocal)) {
  console.error(`Missing file: ${rootEnvLocal}.`)
  console.error('Create it with local Supabase values (URL, anon, service role) or export env vars directly.')
  process.exit(1)
}

// Ensure frontend/.env.local exists (copy root)
fs.copyFileSync(rootEnvLocal, feEnvLocal)
console.log('Copied .env.local -> frontend/.env.local')

// Copy to frontend/.env for Next build/runtime
fs.copyFileSync(feEnvLocal, feEnv)
console.log('Copied frontend/.env.local -> frontend/.env')

console.log('Local env prepared')


