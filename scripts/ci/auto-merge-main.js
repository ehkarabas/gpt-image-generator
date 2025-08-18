#!/usr/bin/env node

/**
 * Automated Main Branch Merge Script
 * Handles automatic merging and validation for main branch updates
 */

const { execSync } = require("child_process");
require("dotenv").config();

async function autoMergeMain() {
  console.log("🔍 Running automated main branch merge validation...");

  try {
    // Get current branch
    const currentBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
    }).trim();
    console.log(`📋 Current branch: ${currentBranch}`);

    // Validate merge source
    if (currentBranch !== "main") {
      console.log("ℹ️  Not on main branch - checking merge validation");

      // Get the last commit message to understand the merge source
      const lastCommit = execSync('git log -1 --pretty=format:"%s"', {
        encoding: "utf8",
      }).trim();
      console.log(`📋 Last commit: ${lastCommit}`);

      if (
        !lastCommit.includes("config/remote") &&
        !lastCommit.includes("config-remote")
      ) {
        throw new Error(
          "❌ Main branch should only receive merges from config/remote",
        );
      }
    }

    // Validate branch strategy compliance
    console.log("📋 Validating branch strategy compliance");

    const branchExists = {
      "config/local": false,
      "config/remote": false,
      main: false,
    };

    try {
      execSync("git show-ref --verify --quiet refs/heads/config/local");
      branchExists["config/local"] = true;
    } catch {}

    try {
      execSync("git show-ref --verify --quiet refs/heads/config/remote");
      branchExists["config/remote"] = true;
    } catch {}

    try {
      execSync("git show-ref --verify --quiet refs/heads/main");
      branchExists["main"] = true;
    } catch {}

    console.log("📋 Branch existence check:");
    console.log(
      `   config/local: ${branchExists["config/local"] ? "✅" : "❌"}`,
    );
    console.log(
      `   config/remote: ${branchExists["config/remote"] ? "✅" : "❌"}`,
    );
    console.log(`   main: ${branchExists["main"] ? "✅" : "❌"}`);

    if (
      !branchExists["config/local"] ||
      !branchExists["config/remote"] ||
      !branchExists["main"]
    ) {
      throw new Error("❌ Required branches missing from repository");
    }

    // Check if main is ahead of config/remote (which shouldn't happen with proper workflow)
    console.log("📋 Checking branch synchronization");

    try {
      const aheadBehind = execSync(
        "git rev-list --left-right --count config/remote...main",
        { encoding: "utf8" },
      ).trim();
      const [behind, ahead] = aheadBehind.split("\t").map(Number);

      if (ahead > 0) {
        console.log(`⚠️  Main is ${ahead} commits ahead of config/remote`);
      } else {
        console.log("✅ Main branch synchronization is healthy");
      }
    } catch (syncError) {
      console.log("⚠️  Branch synchronization check inconclusive");
    }

    // Validate environment consistency
    console.log("📋 Validating environment consistency");

    if (
      process.env.DEPLOYMENT_ENV === "production" ||
      process.env.NODE_ENV === "production"
    ) {
      console.log("✅ Production environment variables detected");
    } else {
      console.log("⚠️  Non-production environment detected");
    }

    // Check for any uncommitted changes
    console.log("📋 Checking for uncommitted changes");

    try {
      const status = execSync("git status --porcelain", {
        encoding: "utf8",
      }).trim();
      if (status) {
        console.log("⚠️  Uncommitted changes detected:");
        console.log(status);
      } else {
        console.log("✅ Working directory clean");
      }
    } catch (statusError) {
      console.log("⚠️  Git status check failed");
    }

    console.log("✅ Automated main branch validation completed");
    console.log("🎉 Branch merge validation successful");

    return true;
  } catch (error) {
    console.error("❌ Automated main branch merge failed:", error.message);
    process.exit(1);
  }
}

// Execute validation
if (require.main === module) {
  autoMergeMain()
    .then(() => {
      console.log("✅ Auto merge validation completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Auto merge validation failed:", error);
      process.exit(1);
    });
}

module.exports = { autoMergeMain };
