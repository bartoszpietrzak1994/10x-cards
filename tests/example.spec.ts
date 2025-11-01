import { test, expect } from '@playwright/test';

 test('homepage has title', async ({ page }) => {
   // Navigate to the home page
   await page.goto('/');

   // Expect the title to contain "10xCards" (adjust if necessary)
   await expect(page).toHaveTitle(/10xCards/);
});
