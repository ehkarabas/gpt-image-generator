const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', '..')
const frontendDir = path.join(root, 'frontend')
const rootEnv = path.join(root, '.env.production')
const feEnvProd = path.join(frontendDir, '.env.production')
const feEnv = path.join(frontendDir, '.env')

if (!fs.existsSync(rootEnv)) {
  console.error(`Missing file: ${rootEnv}. Please add production env first.`)
  process.exit(1)
}

// Ensure frontend/.env.production exists
fs.copyFileSync(rootEnv, feEnvProd)
console.log('Copied .env.production -> frontend/.env.production')

// Copy to frontend/.env for Next build consumption
fs.copyFileSync(feEnvProd, feEnv)
console.log('Copied frontend/.env.production -> frontend/.env')

console.log('Production env prepared')

