/**
 * Step 16: End-to-end edit path
 *
 * Scenario:
 * 1. Open TrendMap in browser.
 * 2. Navigate to Documents and extract signals.
 * 3. Navigate to Signals and generate candidate trends.
 * 4. Navigate to Trends and verify the generated trend.
 * 5. Open Details panel on the trend card.
 * 6. Click Edit Name and use inline form.
 * 7. Verify the updated name appears in details.
 * 8. Close Details and verify on board.
 */
import { test, expect } from '@playwright/test';

test.describe('Edit trend E2E flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders app and navigation links', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Setup' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sources' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Documents' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Signals' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Trends' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Insights' })).toBeVisible();
  });

  test('app root renders the main page content', async ({ page }) => {
    await expect(page.getByRole('navigation', { name: /main navigation/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { level: 2, name: /industry setup/i })).toBeVisible();
  });

  test('full workflow: extract signals -> generate trends -> edit trend via inline form', async ({ page }) => {
    // 1. Navigate to Documents
    await page.getByRole('link', { name: 'Documents' }).click();

    // Show all sources toggle just in case
    await page.getByLabel('show-all-toggle').check();

    // Click extract signals on the first document
    const extractBtn = page.getByRole('button', { name: /extract signals from/i }).first();
    await extractBtn.click();
    await expect(extractBtn).toHaveText('Extracted', { timeout: 5000 });

    // 2. Navigate to Signals
    await page.getByRole('link', { name: 'Signals' }).click();

    // Generate Trends
    const generateBtn = page.getByRole('button', { name: 'Generate Candidate Trends' });
    await generateBtn.click();
    
    // Look for success feedback
    await expect(page.getByText(/Successfully generated/)).toBeVisible();

    // 3. Navigate to Trends
    await page.getByRole('link', { name: 'Trends' }).click();

    // Wait for the specific trend card generated from the AI signal
    const trendCard = page.getByTestId('trend-card').filter({ hasText: 'AI-assisted grocery discovery' });
    await expect(trendCard).toBeVisible({ timeout: 10000 });

    // Open Details
    await trendCard.getByRole('button', { name: 'Details' }).click();

    // Click Edit Name inside Details
    await page.getByRole('button', { name: 'Edit' }).click();

    // Fill inline form
    await page.getByLabel('Edit trend name').fill('E2E Updated Trend Name');
    
    // Save
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify updated name appears in details header
    await expect(page.getByRole('heading', { name: 'E2E Updated Trend Name' })).toBeVisible();

    // Close Details
    await page.getByRole('button', { name: 'Close' }).click();

    // Verify updated name appears on board
    await expect(page.getByTestId('trend-card').filter({ hasText: 'E2E Updated Trend Name' })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Accessibility – Playwright checks', () => {
  test('navigation links are keyboard reachable', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    const tagName = await focused.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('a');
  });

  test('no obviously broken focusable elements (all have accessible names)', async ({ page }) => {
    await page.goto('/');
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const name = await btn.getAttribute('aria-label') ?? await btn.textContent();
      expect(name?.trim()).toBeTruthy();
    }
  });
});
