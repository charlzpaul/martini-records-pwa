import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Invoice PWApp', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('Dashboard page loads', async ({ page }) => {
    // Check if page loaded
    await expect(page).toHaveURL(/http:\/\/localhost:5173\/?/);
    // Take a screenshot to debug
    await page.screenshot({ path: 'test-results/dashboard.png' });
    // Check for any console errors
    const errors = await page.evaluate(() => {
      const consoleErrors = [];
      window.addEventListener('error', (e) => consoleErrors.push(e.message));
      return consoleErrors;
    });
    console.log('Console errors:', errors);
  });

  test('Invoice Builder page loads', async ({ page }) => {
    await page.goto('http://localhost:5173/invoice/new');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/invoice-builder.png' });
  });

  test('Template Builder page loads', async ({ page }) => {
    await page.goto('http://localhost:5173/template/new');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/template-builder.png' });
  });
});
