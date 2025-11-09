import { beforeAll, afterEach, afterAll } from "vitest";
import "@testing-library/jest-dom";

// Setup for all tests
beforeAll(() => {
  // Mock environment variables if needed
  if (!import.meta.env.SITE) {
    import.meta.env.SITE = "http://localhost:4321";
  }
});

// Cleanup after each test
afterEach(() => {
  // Clear all mocks after each test
});

// Cleanup after all tests
afterAll(() => {
  // Final cleanup
});
