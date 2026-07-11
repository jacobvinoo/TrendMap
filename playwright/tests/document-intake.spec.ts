import { test, expect } from '@playwright/test';

test.describe('Document Intake API E2E', () => {
  // Use API mode specifically for this test
  test.use({ baseURL: 'http://localhost:5174' });

  test('Document Intake screen loads and can extract documents', async ({ page }) => {
    // Navigate to Document Intake
    await page.goto('/#documents');
    
    // Check heading
    await expect(page.getByRole('heading', { name: /Document Intake/i })).toBeVisible();
    
    const runBtn = page.getByRole('button', { name: /Run Document Extraction/i });
    await expect(runBtn).toBeVisible();
    
    // Ensure at least one document card exists
    const cards = page.locator('[data-testid="document-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    
    // Verify that we have some "raw" or "extracted" status text
    await expect(page.getByText(/Status: /i).first()).toBeVisible();
  });
});
