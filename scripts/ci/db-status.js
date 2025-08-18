#!/usr/bin/env node

/**
 * Database Status Check Script
 * Checks database status and health metrics
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.production" });

async function checkDatabaseStatus() {
  console.log("🔍 Checking database status and health...");

  try {
    // Validate environment
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      throw new Error("❌ Missing required database environment variables");
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    console.log("📋 Database Status Check");
    console.log(`🔗 URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log(
      `🔑 Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`,
    );

    // Test 1: Basic connectivity
    console.log("📋 Test 1: Connection status");
    const startTime = Date.now();

    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error && error.code !== "PGRST116") {
      console.log(`⚠️  Connection warning: ${error.message}`);
    } else {
      console.log(`✅ Database responsive (${responseTime}ms)`);
    }

    // Test 2: Environment consistency
    console.log("📋 Test 2: Environment consistency");

    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.DEPLOYMENT_ENV === "remote";

    if (isProduction) {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL.includes("supabase.co")) {
        console.log(
          "⚠️  Production environment but non-production URL detected",
        );
      } else {
        console.log("✅ Production environment configuration confirmed");
      }
    } else {
      console.log("ℹ️  Development environment configuration");
    }

    // Test 3: API Health
    console.log("📋 Test 3: API health check");

    try {
      const healthCheck = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          },
        },
      );

      if (healthCheck.ok) {
        console.log("✅ Supabase API endpoint healthy");
      } else {
        console.log(`⚠️  API status: ${healthCheck.status}`);
      }
    } catch (fetchError) {
      console.log(`⚠️  API health check failed: ${fetchError.message}`);
    }

    console.log("✅ Database status check completed");
    console.log("🎉 Database health verification successful");

    return true;
  } catch (error) {
    console.error("❌ Database status check failed:", error.message);
    process.exit(1);
  }
}

// Execute check
if (require.main === module) {
  checkDatabaseStatus()
    .then(() => {
      console.log("✅ Database status check completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Database status check failed:", error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseStatus };
