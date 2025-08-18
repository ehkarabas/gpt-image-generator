#!/usr/bin/env node

/**
 * Local Environment Preparation Script
 * Prepares environment files for local development and testing
 * TDD COMPLIANCE: MUST FAIL when environment is not properly configured
 */

const fs = require("fs");
const path = require("path");

function validateLocalEnvironment() {
  console.log("🔍 Validating local environment configuration...");

  try {
    // CRITICAL: Check if .env.local exists
    const envLocalPath = path.join(process.cwd(), ".env.local");

    if (!fs.existsSync(envLocalPath)) {
      console.error(
        "❌ CRITICAL ERROR: Missing .env.local file in root directory",
      );
      console.error("");
      console.error("🛠️  To fix this issue:");
      console.error(
        "   1. Copy the example file: cp .env.local.example .env.local",
      );
      console.error("   2. Edit .env.local with your actual values");
      console.error("");
      console.error(
        "🚫 E2E tests cannot proceed without proper environment configuration.",
      );
      console.error(
        "   TDD ENFORCEMENT: Tests MUST fail when environment is not configured.",
      );
      process.exit(1); // TDD ENFORCEMENT: Exit with error code 1
    }

    console.log("✅ Found .env.local file");

    // Check if frontend directory exists
    const frontendDir = path.join(process.cwd(), "frontend");
    if (!fs.existsSync(frontendDir)) {
      console.error("❌ CRITICAL ERROR: Frontend directory not found");
      console.error("🛠️  Ensure you are running this from the repository root");
      process.exit(1);
    }

    console.log("✅ Frontend directory found");

    // Read .env.local content
    const envContent = fs.readFileSync(envLocalPath, "utf8");

    // Check for required environment variables
    const requiredVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "OPENAI_API_KEY",
    ];

    const missingVars = [];
    for (const envVar of requiredVars) {
      if (!envContent.includes(envVar) || envContent.includes(`${envVar}=`)) {
        // Check if variable has a value (not just the key)
        const match = envContent.match(new RegExp(`${envVar}=(.+)`));
        if (!match || !match[1] || match[1].trim() === "") {
          missingVars.push(envVar);
        }
      }
    }

    if (missingVars.length > 0) {
      console.error(
        "❌ CRITICAL ERROR: Missing or empty environment variables:",
      );
      missingVars.forEach((envVar) => console.error(`   - ${envVar}`));
      console.error("");
      console.error(
        "🛠️  Edit .env.local and add values for all required variables",
      );
      console.error("");
      console.error(
        "🚫 TDD ENFORCEMENT: Tests cannot proceed with incomplete environment",
      );
      process.exit(1);
    }

    console.log("✅ All required environment variables found");

    // Copy .env.local to frontend/.env.local
    const frontendEnvLocalPath = path.join(frontendDir, ".env.local");
    fs.copyFileSync(envLocalPath, frontendEnvLocalPath);
    console.log("✅ Copied .env.local -> frontend/.env.local");

    // Copy frontend/.env.local to frontend/.env for build process
    const frontendEnvPath = path.join(frontendDir, ".env");
    fs.copyFileSync(frontendEnvLocalPath, frontendEnvPath);
    console.log("✅ Copied frontend/.env.local -> frontend/.env");

    // Validate copied files
    if (!fs.existsSync(frontendEnvLocalPath)) {
      console.error("❌ CRITICAL ERROR: Failed to create frontend/.env.local");
      process.exit(1);
    }

    if (!fs.existsSync(frontendEnvPath)) {
      console.error("❌ CRITICAL ERROR: Failed to create frontend/.env");
      process.exit(1);
    }

    console.log("✅ All required environment variables found");
    console.log("🎉 Local environment prepared successfully!");

    return true;
  } catch (error) {
    console.error("❌ Local environment preparation failed:", error.message);
    console.error("");
    console.error(
      "🚫 TDD ENFORCEMENT: Environment preparation MUST succeed before tests",
    );
    process.exit(1);
  }
}

// Execute preparation
if (require.main === module) {
  try {
    validateLocalEnvironment();
    console.log("✅ Local environment preparation completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Local environment preparation failed:", error);
    process.exit(1);
  }
}

module.exports = { validateLocalEnvironment };
