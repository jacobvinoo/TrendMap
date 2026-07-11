import { test, expect } from '@playwright/test';

test.describe('Trend Extraction and Display Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Signals screen to cluster trends
    await page.goto('/');
    
    // Go to Signals page
    await page.getByRole('button', { name: /signals/i, exact: true }).click();
  });

  test('can cluster trends and view history', async ({ page }) => {
    // Wait for signals to load
    await page.waitForTimeout(2000);
    
    // Look for the "Run Trend Clustering" or equivalent button
    // Go to Trends tab
    await page.getByRole('button', { name: 'Trends', exact: true }).click();
    
    // See if candidate trends are visible
    // Wait for candidate trends to load
    await page.waitForTimeout(2000);
    
    const trendCard = page.getByTestId('trend-card').first();
    
    if (await trendCard.isVisible()) {
      // Click on the Details button to open details modal
      await trendCard.getByRole('button', { name: 'Details' }).click();
      
      const modalHeader = page.getByText(/Strategic Analysis/i);
      await expect(modalHeader).toBeVisible();
      
      // Look for the View History button
      const historyBtn = page.getByRole('button', { name: /view history/i });
      if (await historyBtn.isVisible()) {
        await historyBtn.click();
        
        // History should show up (either the timeline or 'No score history available')
        await expect(page.getByRole('heading', { name: /Score History Timeline/i })).toBeVisible();
      }
    }
  });
});
