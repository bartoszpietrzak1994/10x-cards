import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class ManualFlashcardFormPage {
  readonly page: Page;
  readonly frontTextarea: Locator;
  readonly backTextarea: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.frontTextarea = page.locator("#front");
    this.backTextarea = page.locator("#back");
    this.submitButton = page.locator('[data-test-id="submit-button"]');
    this.successMessage = page.locator('[data-test-id="success-message-section"]');
    this.errorMessage = page.locator('[role="alert"]').filter({ hasText: /error|failed/i });
  }

  async fillFront(value: string) {
    await this.frontTextarea.fill(value);
  }

  async fillBack(value: string) {
    await this.backTextarea.fill(value);
  }

  async clearFront() {
    await this.frontTextarea.clear();
  }

  async clearBack() {
    await this.backTextarea.clear();
  }

  async submit() {
    // Wait for button to be enabled before clicking
    await this.submitButton.waitFor({ state: "visible" });
    await expect(this.submitButton).not.toBeDisabled({ timeout: 5000 });
    await this.submitButton.click();
  }

  async waitForValidation() {
    // Wait for React to process form validation
    // This gives time for the submit button state to update
    await this.page.waitForTimeout(200);
  }

  async getFrontValue() {
    return await this.frontTextarea.inputValue();
  }

  async getBackValue() {
    return await this.backTextarea.inputValue();
  }

  async isSubmitButtonDisabled() {
    return await this.submitButton.isDisabled();
  }

  async waitForSuccessMessage() {
    await this.successMessage.waitFor({ state: "visible" });
  }

  async getSuccessMessageText() {
    return await this.successMessage.textContent();
  }

  async isSuccessMessageVisible() {
    return await this.successMessage.isVisible();
  }

  async clickCreateAnother() {
    await this.page.getByRole("button", { name: /create another/i }).click();
  }

  async clickGoToHome() {
    await this.page.getByRole("button", { name: /go to home/i }).click();
  }
}
