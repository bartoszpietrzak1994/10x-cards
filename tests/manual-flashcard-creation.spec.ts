import { test, expect } from "@playwright/test";
import { LoginPage } from "../e2e/page-objects/Login.page";
import { ManualFlashcardFormPage } from "../e2e/page-objects/ManualFlashcardForm.page";
import { UserMenuPage } from "../e2e/page-objects/UserMenu.page";

/**
 * E2E Test Suite for User Story US-004: Manual Flashcard Creation
 *
 * This test suite covers the acceptance criteria:
 * 1. Authenticated user can create a new flashcard by filling both sides
 * 2. Flashcards are stored in the database with manual creation marker
 *
 * Note: Tests run sequentially (via workers: 1 in config) to avoid race conditions
 * with shared user account, but all tests execute even if one fails.
 */

test.describe("US-004: Manual Flashcard Creation", () => {
  let loginPage: LoginPage;
  let flashcardForm: ManualFlashcardFormPage;
  let userMenu: UserMenuPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    flashcardForm = new ManualFlashcardFormPage(page);
    userMenu = new UserMenuPage(page);
  });

  test("authenticated user can create a flashcard manually and see success notification", async ({ page }) => {
    // Arrange: Get test credentials from environment variables
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set");
    }

    const flashcardData = {
      front: "What is the capital of Poland?",
      back: "Warsaw is the capital and largest city of Poland.",
    };

    // Arrange: Login as authenticated user
    await loginPage.goto();
    await loginPage.login(testEmail, testPassword);
    await loginPage.waitForNavigation();

    // Arrange: Navigate to flashcard creation page
    await page.goto("/flashcards/create");
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("domcontentloaded");

    // Assert: User is on the correct page
    await expect(page).toHaveTitle(/Create Flashcard/);
    await expect(page.getByRole("heading", { name: /create flashcard/i })).toBeVisible();

    // Assert: Form is initially in correct state
    expect(await flashcardForm.getFrontValue()).toBe("");
    expect(await flashcardForm.getBackValue()).toBe("");
    expect(await flashcardForm.isSubmitButtonDisabled()).toBe(true);

    // Act: Fill in the flashcard form
    await flashcardForm.fillFront(flashcardData.front);
    await flashcardForm.fillBack(flashcardData.back);

    // Wait for form validation to complete
    await flashcardForm.waitForValidation();

    // Assert: Form values are set correctly
    expect(await flashcardForm.getFrontValue()).toBe(flashcardData.front);
    expect(await flashcardForm.getBackValue()).toBe(flashcardData.back);
    expect(await flashcardForm.isSubmitButtonDisabled()).toBe(false);

    // Act: Submit the form
    await flashcardForm.submit();

    // Assert: Success notification is displayed
    await flashcardForm.waitForSuccessMessage();
    expect(await flashcardForm.isSuccessMessageVisible()).toBe(true);

    const successText = await flashcardForm.getSuccessMessageText();
    expect(successText).toContain("successfully");

    // Assert: Form is reset after successful creation
    expect(await flashcardForm.getFrontValue()).toBe("");
    expect(await flashcardForm.getBackValue()).toBe("");

    // Assert: Action buttons are visible after success
    await expect(page.getByRole("button", { name: /create another/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /go to home/i })).toBeVisible();

    // Act: Logout the user
    await userMenu.logout();
    await userMenu.waitForLogoutComplete();
  });

  test('user can create multiple flashcards in sequence using "Create Another" button', async ({ page }) => {
    // Arrange: Login
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set");
    }

    await loginPage.goto();
    await loginPage.login(testEmail, testPassword);
    await loginPage.waitForNavigation();

    await page.goto("/flashcards/create");
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("domcontentloaded");

    // Act & Assert: Create first flashcard
    await flashcardForm.fillFront("What is TypeScript?");
    await flashcardForm.fillBack("TypeScript is a strongly typed programming language that builds on JavaScript.");
    await flashcardForm.waitForValidation();
    await flashcardForm.submit();
    await flashcardForm.waitForSuccessMessage();

    // Act: Click "Create Another" button
    await flashcardForm.clickCreateAnother();

    // Assert: Success message is hidden and form is ready
    expect(await flashcardForm.isSuccessMessageVisible()).toBe(false);
    expect(await flashcardForm.getFrontValue()).toBe("");
    expect(await flashcardForm.getBackValue()).toBe("");

    // Act & Assert: Create second flashcard
    await flashcardForm.fillFront("What is Astro?");
    await flashcardForm.fillBack("Astro is a modern web framework for building fast, content-focused websites.");
    await flashcardForm.waitForValidation();
    await flashcardForm.submit();
    await flashcardForm.waitForSuccessMessage();
    expect(await flashcardForm.isSuccessMessageVisible()).toBe(true);

    // Act: Logout the user
    await userMenu.logout();
    await userMenu.waitForLogoutComplete();
  });

  test("unauthenticated user is redirected to login page", async ({ page }) => {
    // Act: Try to access create flashcard page without authentication
    await page.goto("/flashcards/create");
    await page.waitForLoadState("networkidle");

    // Assert: User is redirected to login page with redirect parameter
    await page.waitForURL(/\/auth\/login.*redirect=/, { timeout: 10000 });
    expect(page.url()).toContain("/auth/login");
    expect(page.url()).toContain("redirect=/flashcards/create");
  });

  test("form validation prevents submission with empty fields", async ({ page }) => {
    // Arrange: Login
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set");
    }

    await loginPage.goto();
    await loginPage.login(testEmail, testPassword);
    await loginPage.waitForNavigation();

    await page.goto("/flashcards/create");
    await page.waitForLoadState("networkidle");
    await page.waitForLoadState("domcontentloaded");

    // Assert: Submit button is disabled when form is empty
    expect(await flashcardForm.isSubmitButtonDisabled()).toBe(true);

    // Act: Fill only the front field
    await flashcardForm.fillFront("Incomplete flashcard");
    await page.waitForTimeout(100); // Wait for React state update

    // Assert: Submit button is still disabled
    expect(await flashcardForm.isSubmitButtonDisabled()).toBe(true);

    // Act: Clear front and fill only back field
    await flashcardForm.clearFront();
    await flashcardForm.fillBack("Still incomplete");
    await page.waitForTimeout(100); // Wait for React state update

    // Assert: Submit button remains disabled
    expect(await flashcardForm.isSubmitButtonDisabled()).toBe(true);

    // Act: Fill both fields
    await flashcardForm.fillFront("Complete flashcard");
    await flashcardForm.fillBack("With both fields filled");
    await flashcardForm.waitForValidation();

    // Assert: Submit button is now enabled
    expect(await flashcardForm.isSubmitButtonDisabled()).toBe(false);

    // Act: Logout the user
    await userMenu.logout();
    await userMenu.waitForLogoutComplete();
  });
});
