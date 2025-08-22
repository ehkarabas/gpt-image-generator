#!/usr/bin/env node

/**
 * Start Next.js dev server for remote E2E tests
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Set environment to use production config
process.env.DEPLOYMENT_ENV = 'remote';

// Copy production env to frontend/.env
const rootEnvProd = path.join(__dirname, '..', '..', '.env.production');
const frontendEnv = path.join(__dirname, '..', '..', 'frontend', '.env');
const frontendEnvProd = path.join(__dirname, '..', '..', 'frontend', '.env.production');

if (fs.existsSync(rootEnvProd)) {
  fs.copyFileSync(rootEnvProd, frontendEnvProd);
  fs.copyFileSync(rootEnvProd, frontendEnv);
  console.log('✅ Copied production environment files');
}

// Add DEPLOYMENT_ENV to the env file
const envContent = fs.readFileSync(frontendEnv, 'utf8');
if (!envContent.includes('DEPLOYMENT_ENV=')) {
  fs.appendFileSync(frontendEnv, '\nDEPLOYMENT_ENV=remote\n');
}

console.log('🚀 Starting Next.js development server with production config...');
console.log('   URL: http://localhost:3000');
console.log('   Environment: Remote (using production Supabase)');

// Start Next.js dev server
const nextProcess = spawn('npm', ['run', 'dev:local'], {
  cwd: path.join(__dirname, '..', '..', 'frontend'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DEPLOYMENT_ENV: 'remote',
    NODE_ENV: 'development' // Keep as development for Next.js dev server
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Stopping Next.js server...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  nextProcess.kill('SIGTERM');
  process.exit(0);
});

nextProcess.on('error', (error) => {
  console.error('❌ Failed to start Next.js server:', error);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  console.log(`Next.js server exited with code ${code}`);
  process.exit(code);
});
