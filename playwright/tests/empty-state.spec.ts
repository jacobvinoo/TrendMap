import { test, expect } from '@playwright/test';

test.describe('Empty State Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Shows empty state messages before data is generated', async ({ page }) => {
    // Check Signals empty state
    await page.getByRole('link', { name: 'Signals' }).click();
    await expect(page.getByText('No signals extracted yet.')).toBeVisible();

    // Check Trends empty state
    await page.getByRole('link', { name: 'Trends' }).click();
    await expect(page.getByText('No candidate trends to review.')).toBeVisible();

    // Check Insights empty state
    await page.getByRole('link', { name: 'Insights' }).click();
    await expect(page.getByText('No approved trends available for analysis.')).toBeVisible();
  });
});
