#!/usr/bin/env node

/**
 * Clean Next.js cache and restart server for remote E2E
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧹 Cleaning Next.js cache...');

// Clean .next directory
const nextDir = path.join(__dirname, '..', '..', 'frontend', '.next');
if (fs.existsSync(nextDir)) {
  console.log('   Removing .next directory...');
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('✅ .next directory removed');
}

console.log('🔄 Rebuilding and starting server...');

// Change to frontend directory
process.chdir(path.join(__dirname, '..', '..', 'frontend'));

// Start dev server (it will rebuild automatically)
console.log('🚀 Starting Next.js dev server with clean build...');
execSync('npm run dev:local', { stdio: 'inherit' });
