import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration that works with both local testing and GitHub Actions.
 * Environment variables should be set externally:
 * - Local: Load via dotenv CLI (e.g., `dotenv -e .env.test -- npx playwright test`)
 *   or source the env file before running tests
 * - GitHub Actions: Set environment variables directly in the workflow
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
    // Base URL is configurable via PLAYWRIGHT_BASE_URL environment variable
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
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
});
