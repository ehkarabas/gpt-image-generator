#!/usr/bin/env node

/**
 * Production Setup Script
 * Prepares production build for E2E testing
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Production Setup Starting...')

// 1. Clean previous builds
console.log('1️⃣ Cleaning previous builds...')
try {
  execSync('cd frontend && rm -rf .next', { stdio: 'inherit' })
  console.log('✅ Clean completed')
} catch (error) {
  console.log('ℹ️ No previous build to clean')
}

// 2. Build production version
console.log('2️⃣ Building production version...')
try {
  execSync('cd frontend && npm run build:remote', { stdio: 'inherit' })
  console.log('✅ Production build completed')
} catch (error) {
  console.error('❌ Production build failed')
  process.exit(1)
}

// 3. Kill any existing servers
console.log('3️⃣ Cleaning up ports...')
try {
  execSync('npx kill-port 3000 3001 3002', { stdio: 'pipe' })
  console.log('✅ Ports cleaned')
} catch (error) {
  console.log('ℹ️ No processes to kill on ports')
}

// 4. For E2E testing, we'll let the test framework start the server
console.log('4️⃣ Production server ready for E2E testing...')
console.log('ℹ️ E2E framework will handle server startup')

console.log('✨ Production Setup Complete')
console.log('🎯 Ready for E2E testing on production build')