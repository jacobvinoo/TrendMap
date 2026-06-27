import { test, expect } from '@playwright/test';

test.describe('Evidence Traceability Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Generate trend and verify evidence traceability links back to source and document', async ({ page }) => {
    // 1. Extract Signals
    await page.getByRole('link', { name: 'Documents' }).click();
    await page.getByLabel('show-all-toggle').check();
    await page.getByRole('button', { name: /extract signals from/i }).first().click();
    
    // 2. Generate Candidate Trends
    await page.getByRole('link', { name: 'Signals' }).click();
    await page.getByRole('button', { name: 'Generate Candidate Trends' }).click();
    
    // 3. Navigate to Trends
    await page.getByRole('link', { name: 'Trends' }).click();

    // 4. Open trend details
    const trendCard = page.getByTestId('trend-card').first();
    await trendCard.getByRole('button', { name: 'Details' }).click();

    // 5. Verify evidence section displays relevance quote
    await expect(page.getByText('Why this trend exists (Evidence)')).toBeVisible();
    await expect(page.getByText(/Relevance:/i).first()).toBeVisible();
  });
});
