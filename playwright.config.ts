import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  // Directory where your test files are located.
  testDir: './tests',

  // Maximum time one test can run for.
  timeout: 30000,

  // Expect options for assertions.
  expect: {
    timeout: 5000,
  },

  // Run tests in files in parallel.
  fullyParallel: true,

  // Reporter configuration (HTML reporter will output reports after tests complete).
  reporter: 'html',

  // Shared settings for all tests.
  use: {
    // Replace with your actual base URL once your dev server is running.
    baseURL: 'http://localhost:3000',
    // Enable trace on first retry for easier debugging.
    trace: 'on-first-retry',
  },

  // Configure projects for different browsers.
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
  ],
});
