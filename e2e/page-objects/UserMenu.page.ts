import type { Page, Locator } from "@playwright/test";

export class UserMenuPage {
  readonly page: Page;
  readonly userMenuButton: Locator;
  readonly logoutButton: Locator;
  readonly dropdownMenu: Locator;
  readonly accountLabel: Locator;
  readonly generateFlashcardsLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userMenuButton = page.locator('[data-test-id="user-menu-button"]');
    this.logoutButton = page.locator('[data-test-id="logout-button"]');
    this.dropdownMenu = page.locator('[role="menu"]');
    this.accountLabel = page.getByText("My Account");
    this.generateFlashcardsLink = page.getByRole("menuitem").filter({ hasText: "Generate Flashcards" });
  }

  async openMenu() {
    await this.userMenuButton.click();
    await this.dropdownMenu.waitFor({ state: "visible" });
  }

  async logout() {
    await this.openMenu();
    await this.logoutButton.click();
  }

  async isMenuOpen() {
    return await this.dropdownMenu.isVisible();
  }

  async clickGenerateFlashcards() {
    await this.openMenu();
    await this.generateFlashcardsLink.click();
  }

  async getUserEmail() {
    return await this.userMenuButton.textContent();
  }

  async isLogoutButtonDisabled() {
    return await this.logoutButton.isDisabled();
  }

  async waitForLogoutComplete() {
    await this.page.waitForURL(/.*\/auth\/login/);
  }
}
