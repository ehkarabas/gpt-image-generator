import dotenv from 'dotenv';

// Load environment variables based on deployment environment
const deploymentEnv = process.env.DEPLOYMENT_ENV || 'local';
const envPath = deploymentEnv === 'remote' 
  ? './frontend/.env.production'
  : './frontend/.env.local';

// Load appropriate environment file
dotenv.config({ path: envPath });
// Ensure the prepared .env (copied by CI scripts) has final precedence
dotenv.config({ path: './frontend/.env', override: true });

import { defineConfig, devices } from '@playwright/test';

// For remote E2E, run against a local Next dev server (using production env)
const useLocalWeb = deploymentEnv === 'remote';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: useLocalWeb ? 'http://localhost:3000' : (process.env.E2E_BASE_URL || 'http://localhost:3000'),

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run local dev server for remote tests instead of hitting Vercel */
  webServer: useLocalWeb
    ? {
        command: 'npm run dev:local',
        url: 'http://localhost:3000',
        cwd: 'frontend',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      }
    : undefined,
});
