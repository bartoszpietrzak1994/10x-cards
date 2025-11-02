# E2E Testing Documentation for 10xCards

This directory contains end-to-end (E2E) tests for the 10xCards application using Playwright.

## Test Structure

### Test Files
- `manual-flashcard-creation.spec.ts` - Tests for User Story US-004: Manual Flashcard Creation

### Page Objects
Page Object Models are located in `/e2e/page-objects/`:
- `Login.page.ts` - Page object for login functionality
- `ManualFlashcardForm.page.ts` - Page object for manual flashcard creation form

## Setup Instructions

### Prerequisites
1. Node.js version 22.14.0 or higher
2. A running instance of the application on `http://localhost:3000`
3. A test user account in your Supabase database

### Environment Configuration

1. Create a `.env.test` file in the project root:
   ```bash
   touch .env.test
   ```

2. Add your test user credentials:
   ```bash
   E2E_USERNAME=your-test-user@example.com
   E2E_PASSWORD=your-test-password
   ```

   **Important:** 
   - This user must exist in your Supabase database
   - Use a dedicated test account, not a production account
   - The `.env.test` file is already in `.gitignore` to prevent committing credentials

### Installing Dependencies

Install Playwright browsers (first time only):
```bash
npx playwright install chromium
```

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Tests in UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Run Tests in Debug Mode
```bash
npm run test:e2e:debug
```

### Run Specific Test File
```bash
npx playwright test manual-flashcard-creation.spec.ts
```

### Run Specific Test by Name
```bash
npx playwright test -g "authenticated user can create a flashcard"
```

## Test Coverage

### US-004: Manual Flashcard Creation
**File:** `manual-flashcard-creation.spec.ts`

**Test Cases:**

1. **Authenticated user can create a flashcard manually and see success notification**
   - Verifies the complete flow from login to successful flashcard creation
   - Checks form validation, submission, and success notification
   - Ensures form resets after successful creation

2. **User can create multiple flashcards in sequence using "Create Another" button**
   - Tests the workflow of creating multiple flashcards
   - Verifies the "Create Another" button functionality
   - Ensures success message handling between creations

3. **Unauthenticated user is redirected to login page**
   - Tests access control for the create flashcard page
   - Verifies redirect with return URL parameter

4. **Form validation prevents submission with empty fields**
   - Tests client-side validation logic
   - Verifies submit button disabled state
   - Ensures both fields must be filled

## Writing New Tests

### Best Practices

1. **Use Page Object Model (POM)**
   - Create page objects in `/e2e/page-objects/`
   - Encapsulate page interactions in page object methods
   - Keep test files clean and focused on business logic

2. **Follow AAA Pattern**
   - **Arrange:** Set up test data and navigate to the page
   - **Act:** Perform the action being tested
   - **Assert:** Verify the expected outcome

3. **Use `data-test-id` Attributes**
   - Prefer `data-test-id` selectors for resilience
   - Fall back to semantic selectors (roles, labels) when needed
   - Avoid relying on CSS classes or IDs that may change

4. **Write Descriptive Test Names**
   - Use clear, behavior-focused test names
   - Include the user role, action, and expected outcome

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { YourPage } from '../e2e/page-objects/YourPage.page';

test.describe('Feature Name', () => {
  let yourPage: YourPage;

  test.beforeEach(async ({ page }) => {
    yourPage = new YourPage(page);
    // Common setup
  });

  test('should perform expected behavior', async ({ page }) => {
    // Arrange
    await yourPage.goto();
    
    // Act
    await yourPage.performAction();
    
    // Assert
    expect(await yourPage.getResult()).toBe('expected');
  });
});
```

## Debugging Tests

### Using Playwright Inspector
```bash
npm run test:e2e:debug
```

### Using Trace Viewer
Traces are automatically captured on first retry (configured in `playwright.config.ts`).

View traces after a failed test:
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Using VS Code Extension
1. Install the "Playwright Test for VSCode" extension
2. Use the Test Explorer to run and debug tests
3. Set breakpoints directly in test files

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22.14.0'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run preview &
      - run: npx wait-on http://localhost:3000
      - run: npm run test:e2e
        env:
          E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
          E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
```

## Troubleshooting

### Common Issues

1. **"E2E_USERNAME and E2E_PASSWORD must be set" error**
   - Ensure `.env.test` exists and contains valid credentials
   - Check that the test user exists in your Supabase database

2. **Tests timeout or fail to load pages**
   - Verify the development server is running on `http://localhost:3000`
   - Check network connectivity and firewall settings
   - Increase timeout in `playwright.config.ts` if needed

3. **Authentication failures**
   - Verify test user credentials are correct
   - Ensure the user's email is confirmed in Supabase
   - Check that RLS policies allow the test user to access resources

4. **Flaky tests**
   - Add explicit waits using `waitFor()` methods
   - Use `waitForLoadState('networkidle')` after navigation
   - Ensure proper cleanup in `afterEach` hooks

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model Guide](https://playwright.dev/docs/pom)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)

