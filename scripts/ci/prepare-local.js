const fs = require('fs')
const path = require('path')

console.log('🚀 Preparing local environment for E2E testing...')

const root = path.resolve(__dirname, '..', '..')
const frontendDir = path.join(root, 'frontend')
const rootEnvLocal = path.join(root, '.env.local')
const rootEnvExample = path.join(root, '.env.local.example')
const feEnvLocal = path.join(frontendDir, '.env.local')
const feEnv = path.join(frontendDir, '.env')

// Enhanced validation with detailed error messages
function validateEnvironment() {
  console.log('🔍 Validating environment setup...')
  
  // Check if root .env.local exists
  if (!fs.existsSync(rootEnvLocal)) {
    console.error('❌ CRITICAL ERROR: Missing .env.local file in root directory')
    console.error('')
    console.error('🛠️  To fix this issue:')
    
    if (fs.existsSync(rootEnvExample)) {
      console.error(`   1. Copy the example file: cp .env.local.example .env.local`)
      console.error(`   2. Edit .env.local with your actual values`)
    } else {
      console.error(`   1. Create .env.local file in root directory`)
      console.error(`   2. Add required environment variables:`)
      console.error(`      - NEXT_PUBLIC_SUPABASE_URL`)
      console.error(`      - NEXT_PUBLIC_SUPABASE_ANON_KEY`) 
      console.error(`      - SUPABASE_SERVICE_ROLE_KEY`)
      console.error(`      - OPENAI_API_KEY`)
    }
    console.error('')
    console.error('🚫 E2E tests cannot proceed without proper environment configuration.')
    console.error('   TDD ENFORCEMENT: Tests MUST fail when environment is not configured.')
    process.exit(1)
  }

  // Check frontend directory exists
  if (!fs.existsSync(frontendDir)) {
    console.error('❌ CRITICAL ERROR: Frontend directory not found')
    console.error(`   Expected: ${frontendDir}`)
    process.exit(1)
  }

  console.log('✅ Environment validation passed')
}

// Copy environment files with validation
function copyEnvironmentFiles() {
  console.log('📋 Copying environment files...')
  
  try {
    // Copy root .env.local to frontend/.env.local
    fs.copyFileSync(rootEnvLocal, feEnvLocal)
    console.log('✅ Copied .env.local -> frontend/.env.local')

    // Copy frontend/.env.local to frontend/.env for Next.js
    fs.copyFileSync(feEnvLocal, feEnv)
    console.log('✅ Copied frontend/.env.local -> frontend/.env')
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR: Failed to copy environment files')
    console.error(`   Error: ${error.message}`)
    console.error('')
    console.error('🚫 E2E tests cannot proceed without proper file copying.')
    process.exit(1)
  }
}

// Validate essential environment variables
function validateEnvironmentVariables() {
  console.log('🔑 Validating environment variables...')
  
  const envContent = fs.readFileSync(rootEnvLocal, 'utf8')
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
    console.error('❌ CRITICAL ERROR: Missing required environment variables')
    console.error('')
    console.error('🚫 Missing variables:')
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`)
    })
    console.error('')
    console.error('🛠️  Add these variables to your .env.local file')
    console.error('🚫 E2E tests cannot proceed without all required environment variables.')
    process.exit(1)
  }
  
  console.log('✅ All required environment variables found')
}

// Main execution
function main() {
  try {
    validateEnvironment()
    copyEnvironmentFiles()
    validateEnvironmentVariables()
    
    console.log('')
    console.log('🎉 Local environment prepared successfully!')
    console.log('✅ E2E tests can now proceed with proper environment configuration')
    console.log('')
    
  } catch (error) {
    console.error('❌ FATAL ERROR: Environment preparation failed')
    console.error(`   Error: ${error.message}`)
    console.error('')
    console.error('🚫 TDD ENFORCEMENT: E2E tests MUST NOT proceed with broken environment')
    process.exit(1)
  }
}

main()
