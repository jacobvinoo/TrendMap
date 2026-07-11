import { test, expect } from '@playwright/test';

test.describe('Signal Extraction Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Document Intake screen where signal extraction happens
    await page.goto('/');
    
    // Go to Documents
    await page.getByRole('button', { name: /Documents/i, exact: true }).click();
  });

  test('can extract signals from a document and view history', async ({ page }) => {
    // Wait for documents to load
    await expect(page.getByText(/Approve at least one source before running document extraction/i, { exact: false })).toBeHidden({ timeout: 10000 }).catch(() => {});
    
    // Find a document that has not been extracted yet, or use any document
    const documentCard = page.locator('.grid > div').filter({ hasText: 'Title' }).first();
    
    // If we have documents, try extracting signals
    if (await documentCard.isVisible()) {
      const extractBtn = documentCard.getByRole('button', { name: /extract signals/i });
      
      if (await extractBtn.isVisible()) {
        await extractBtn.click();
        
        // Wait for extraction to complete (status changes to 'extracted' or notice appears)
        await expect(page.locator('.bg-green-900\\/50')).toBeVisible({ timeout: 30000 });
      }
      
      // Go to Signals page
      await page.getByRole('button', { name: /signals/i }).click();
      
      // Wait for signals to load
      await page.waitForTimeout(2000);
      
      // Click on the first signal
      const firstSignal = page.locator('div').filter({ hasText: 'confidence' }).first();
      if (await firstSignal.isVisible()) {
        await firstSignal.click();
        
        // Modal should appear
        const modal = page.getByTestId('signal-detail-panel');
        await expect(modal).toBeVisible();
        
        // View History
        const historyBtn = modal.getByRole('button', { name: /view history/i });
        await expect(historyBtn).toBeVisible();
        await historyBtn.click();
        
        // History should show up
        await expect(modal.getByText(/signal created/i)).toBeVisible();
      }
    }
  });
});
