import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration that works with both local testing and GitHub Actions.
 * Environment variables should be set externally:
 * - Local: Load via dotenv CLI (e.g., `dotenv -e .env.test -- npx playwright test`)
 *   or source the env file before running tests
 * - GitHub Actions: Set environment variables directly in the workflow
 *
 * The webServer configuration automatically starts the Astro dev server before
 * running tests and waits for it to be ready, ensuring reliable test execution
 * in both local and CI environments.
 */
export default defineConfig({
  // Directory where your test files are located.
  testDir: "./tests",

  // Maximum time one test can run for.
  timeout: 30000,

  // Expect options for assertions.
  expect: {
    timeout: 5000,
  },

  // Run tests in files in parallel.
  fullyParallel: true,

  // Reporter configuration (HTML reporter will output reports after tests complete).
  reporter: "html",

  // Shared settings for all tests.
  use: {
    // Make baseURL configurable via environment variable with fallback
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    // Enable trace on first retry for easier debugging.
    trace: "on-first-retry",
  },

  // Configure projects for different browsers.
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Use a single worker to prevent race conditions with shared test user
  // This ensures tests run sequentially while still running all tests even if one fails
  workers: 1,

  // Automatically start the dev server before tests and stop it after
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3000",
    timeout: 120 * 1000, // 2 minutes to start
    reuseExistingServer: !process.env.CI, // In CI, always start fresh
  },
});
