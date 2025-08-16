const fs = require('fs')
const path = require('path')

console.log('🚀 Preparing production environment for E2E testing...')

const root = path.resolve(__dirname, '..', '..')
const frontendDir = path.join(root, 'frontend')
const rootEnvProd = path.join(root, '.env.production')
const rootEnvExample = path.join(root, '.env.production.example')
const feEnvProd = path.join(frontendDir, '.env.production')
const feEnv = path.join(frontendDir, '.env')

// Enhanced validation with detailed error messages
function validateEnvironment() {
  console.log('🔍 Validating production environment setup...')
  
  // Check if root .env.production exists
  if (!fs.existsSync(rootEnvProd)) {
    console.error('❌ CRITICAL ERROR: Missing .env.production file in root directory')
    console.error('')
    console.error('🛠️  To fix this issue:')
    
    if (fs.existsSync(rootEnvExample)) {
      console.error(`   1. Copy the example file: cp .env.production.example .env.production`)
      console.error(`   2. Edit .env.production with your actual production values`)
    } else {
      console.error(`   1. Create .env.production file in root directory`)
      console.error(`   2. Add required production environment variables:`)
      console.error(`      - NEXT_PUBLIC_SUPABASE_URL`)
      console.error(`      - NEXT_PUBLIC_SUPABASE_ANON_KEY`) 
      console.error(`      - SUPABASE_SERVICE_ROLE_KEY`)
      console.error(`      - OPENAI_API_KEY`)
    }
    console.error('')
    console.error('🚫 Production E2E tests cannot proceed without proper environment configuration.')
    console.error('   TDD ENFORCEMENT: Tests MUST fail when production environment is not configured.')
    process.exit(1)
  }

  // Check frontend directory exists
  if (!fs.existsSync(frontendDir)) {
    console.error('❌ CRITICAL ERROR: Frontend directory not found')
    console.error(`   Expected: ${frontendDir}`)
    process.exit(1)
  }

  console.log('✅ Production environment validation passed')
}

// Copy environment files with validation
function copyEnvironmentFiles() {
  console.log('📋 Copying production environment files...')
  
  try {
    // Copy root .env.production to frontend/.env.production
    fs.copyFileSync(rootEnvProd, feEnvProd)
    console.log('✅ Copied .env.production -> frontend/.env.production')

    // Copy frontend/.env.production to frontend/.env for Next.js
    fs.copyFileSync(feEnvProd, feEnv)
    console.log('✅ Copied frontend/.env.production -> frontend/.env')
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR: Failed to copy production environment files')
    console.error(`   Error: ${error.message}`)
    console.error('')
    console.error('🚫 Production E2E tests cannot proceed without proper file copying.')
    process.exit(1)
  }
}

// Validate essential production environment variables
function validateEnvironmentVariables() {
  console.log('🔑 Validating production environment variables...')
  
  const envContent = fs.readFileSync(rootEnvProd, 'utf8')
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'OPENAI_API_KEY'
  ]
  
  const missingVars = []
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName) || envContent.includes(`${varName}=`) === false) {
      missingVars.push(varName)
    }
  }
  
  if (missingVars.length > 0) {
    console.error('❌ CRITICAL ERROR: Missing required production environment variables')
    console.error('')
    console.error('🚫 Missing variables:')
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`)
    })
    console.error('')
    console.error('🛠️  Add these variables to your .env.production file')
    console.error('🚫 Production E2E tests cannot proceed without all required environment variables.')
    process.exit(1)
  }
  
  console.log('✅ All required production environment variables found')
}

// Main execution
function main() {
  try {
    validateEnvironment()
    copyEnvironmentFiles()
    validateEnvironmentVariables()
    
    console.log('')
    console.log('🎉 Production environment prepared successfully!')
    console.log('✅ Production E2E tests can now proceed with proper environment configuration')
    console.log('')
    
  } catch (error) {
    console.error('❌ FATAL ERROR: Production environment preparation failed')
    console.error(`   Error: ${error.message}`)
    console.error('')
    console.error('🚫 TDD ENFORCEMENT: Production E2E tests MUST NOT proceed with broken environment')
    process.exit(1)
  }
}

main()
