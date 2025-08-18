#!/usr/bin/env node

/**
 * Local Development Setup Script
 * Prepares development environment for E2E testing
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔧 Local Development Setup Starting...");

// 1. Clean previous builds
console.log("1️⃣ Cleaning previous builds...");
try {
  execSync("cd frontend && rm -rf .next", { stdio: "inherit" });
  console.log("✅ Clean completed");
} catch (error) {
  console.log("ℹ️ No previous build to clean");
}

// 2. Start Supabase (if not running)
console.log("2️⃣ Ensuring Supabase is running...");
try {
  execSync("npx supabase status", { stdio: "pipe" });
  console.log("✅ Supabase already running");
} catch (error) {
  console.log("🚀 Starting Supabase...");
  execSync("npx supabase start", { stdio: "inherit" });
  console.log("✅ Supabase started");
}

// 3. Build local production version (for E2E testing)
console.log("3️⃣ Building local production version...");
try {
  execSync("cd frontend && npm run build:local", { stdio: "inherit" });
  console.log("✅ Local production build completed");
} catch (error) {
  console.error("❌ Local production build failed");
  process.exit(1);
}

// 4. Kill any existing dev servers
console.log("4️⃣ Cleaning up ports...");
try {
  execSync("npx kill-port 3000 3001", { stdio: "pipe" });
  console.log("✅ Ports cleaned");
} catch (error) {
  console.log("ℹ️ No processes to kill on ports");
}

console.log("✨ Local Production Setup Complete");
console.log("🎯 Ready for E2E testing on local production build");
