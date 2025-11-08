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
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
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
