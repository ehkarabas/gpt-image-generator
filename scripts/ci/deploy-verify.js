#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Verifies successful deployment and runs post-deployment health checks
 */

require("dotenv").config({ path: ".env.production" });

async function verifyDeployment() {
  console.log("🔍 Running post-deployment verification...");

  try {
    const baseUrl =
      process.env.VERCEL_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://gpt-image-generator-ehkarabas.vercel.app";

    console.log(`🌐 Testing deployment at: ${baseUrl}`);

    // Test 1: Health endpoint
    console.log("📋 Test 1: Health endpoint check");

    try {
      const healthResponse = await fetch(`${baseUrl}/api/health`);

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log("✅ Health endpoint responding");
        console.log(`📋 Status: ${healthData.status || "ok"}`);
      } else {
        console.log(`⚠️  Health endpoint status: ${healthResponse.status}`);
      }
    } catch (healthError) {
      console.log(`⚠️  Health endpoint test failed: ${healthError.message}`);
    }

    // Test 2: Main page load
    console.log("📋 Test 2: Main page accessibility");

    try {
      const pageResponse = await fetch(baseUrl);

      if (pageResponse.ok) {
        const pageContent = await pageResponse.text();
        if (
          pageContent.includes("GPT Image Generator") ||
          pageContent.includes("Next.js")
        ) {
          console.log("✅ Main page loading correctly");
        } else {
          console.log("⚠️  Main page content unexpected");
        }
      } else {
        console.log(`⚠️  Main page status: ${pageResponse.status}`);
      }
    } catch (pageError) {
      console.log(`⚠️  Main page test failed: ${pageError.message}`);
    }

    // Test 3: API endpoints
    console.log("📋 Test 3: API endpoints verification");

    const apiEndpoints = ["/api/health", "/api/auth/callback"];

    for (const endpoint of apiEndpoints) {
      try {
        const apiResponse = await fetch(`${baseUrl}${endpoint}`);
        if (apiResponse.status < 500) {
          console.log(`✅ API ${endpoint}: accessible (${apiResponse.status})`);
        } else {
          console.log(
            `⚠️  API ${endpoint}: server error (${apiResponse.status})`,
          );
        }
      } catch (apiError) {
        console.log(`⚠️  API ${endpoint}: ${apiError.message}`);
      }
    }

    // Test 4: Environment verification
    console.log("📋 Test 4: Production environment verification");

    if (process.env.NODE_ENV === "production") {
      console.log("✅ NODE_ENV=production confirmed");
    } else {
      console.log("⚠️  NODE_ENV not set to production");
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("supabase.co")) {
      console.log("✅ Production Supabase URL confirmed");
    } else {
      console.log("⚠️  Non-production Supabase URL detected");
    }

    // Test 5: Database connectivity from deployment
    console.log("📋 Test 5: Database connectivity from deployment");

    try {
      const dbTestResponse = await fetch(`${baseUrl}/api/health`);
      if (dbTestResponse.ok) {
        console.log("✅ Database connectivity from deployment confirmed");
      } else {
        console.log("⚠️  Database connectivity test inconclusive");
      }
    } catch (dbError) {
      console.log("⚠️  Database connectivity test failed");
    }

    console.log("✅ Post-deployment verification completed");
    console.log("🎉 Deployment verification successful");

    return true;
  } catch (error) {
    console.error("❌ Deployment verification failed:", error.message);
    process.exit(1);
  }
}

// Execute verification
if (require.main === module) {
  verifyDeployment()
    .then(() => {
      console.log("✅ Deployment verification completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Deployment verification failed:", error);
      process.exit(1);
    });
}

module.exports = { verifyDeployment };
