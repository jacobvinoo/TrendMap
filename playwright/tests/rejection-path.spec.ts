import { test, expect } from '@playwright/test';

test.describe('Rejection Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Generate trend, reject it, and ensure it is hidden from default board and insights', async ({ page }) => {
    // 1. Extract Signals
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.getByLabel('show-all-toggle').check();
    await page.getByRole('button', { name: /extract signals from/i }).first().click();
    
    // 2. Generate Candidate Trends
    await page.getByRole('link', { name: 'Signals' }).click();
    await page.getByRole('button', { name: 'Generate Candidate Trends' }).click();
    
    // 3. Navigate to Trends
    await page.getByRole('link', { name: 'Trends' }).click();

    // 4. Reject the trend
    const trendCard = page.getByTestId('trend-card').first();
    const trendName = await trendCard.locator('h3').textContent();
    
    // Wait for buttons to be ready
    await trendCard.getByRole('button', { name: 'Reject' }).click();

    // Verify it disappears from candidate view
    await expect(page.getByTestId('trend-card').filter({ hasText: trendName! })).not.toBeVisible();

    // 5. Navigate to Insights
    await page.getByRole('link', { name: 'Insights' }).click();

    // Verify it does not appear in insights
    await expect(page.getByText(trendName!)).not.toBeVisible();
  });
});
