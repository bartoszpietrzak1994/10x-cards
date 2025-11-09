import type { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator("#email");
    this.passwordInput = page.locator("#password");
    this.submitButton = page.locator('form button[type="submit"]');
    this.errorAlert = page.locator('[role="alert"]');
  }

  async goto() {
    await this.page.goto("/auth/login");
    // Wait for the form to be ready (React hydration)
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });
  }

  async login(email: string, password: string) {
    // Wait for inputs to be ready and interactive
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });

    // Wait for React hydration by waiting for the form to be interactive
    await this.page.waitForLoadState("networkidle");

    // Fill email with retry logic
    for (let i = 0; i < 3; i++) {
      await this.emailInput.clear();
      await this.emailInput.fill(email);
      await this.page.waitForTimeout(200);
      const emailValue = await this.emailInput.inputValue();
      if (emailValue === email) break;
      if (i === 2) {
        throw new Error(`Failed to fill email field after 3 attempts. Current value: "${emailValue}"`);
      }
    }

    // Fill password with retry logic
    for (let i = 0; i < 3; i++) {
      await this.passwordInput.clear();
      await this.passwordInput.fill(password);
      await this.page.waitForTimeout(200);
      const passwordValue = await this.passwordInput.inputValue();
      if (passwordValue === password) break;
      if (i === 2) {
        throw new Error(`Failed to fill password field after 3 attempts. Current value: "${passwordValue}"`);
      }
    }

    await this.submitButton.click();
  }

  async waitForNavigation() {
    await this.page.waitForURL(/^(?!.*\/auth\/login).*$/);
  }

  async isErrorVisible() {
    return await this.errorAlert.isVisible();
  }

  async getErrorText() {
    return await this.errorAlert.textContent();
  }
}
