import { test, expect } from '@playwright/test';

test.describe('Phase 1: Source Ingestion Flow', () => {
  test('Discover, Approve, and Extract Documents from Sources', async ({ page }) => {
    // Navigate to Setup
    await page.goto('/#setup');
    await expect(page.getByRole('heading', { name: /Industry Setup/i })).toBeVisible();

    // Fill in required name
    await page.getByLabel('industry-name').fill('E2E Ingestion Industry');
    await page.getByLabel('save-button').click();
    await expect(page.getByText('Saved')).toBeVisible();

    // Click "Find Sources"
    await page.getByRole('button', { name: /Find Sources/i }).click();

    // App auto-redirects to #sources, wait for it
    await expect(page).toHaveURL(/.*#sources/);
    await expect(page.getByRole('heading', { name: /Source Library/i })).toBeVisible();

    // Wait for suggested sources to appear
    const suggestedSource = page.locator('[data-testid="source-card"]').filter({ hasText: /Gartner/i });
    await expect(suggestedSource).toBeVisible({ timeout: 10000 });

    // Approve the source if not already approved
    const approveBtn = suggestedSource.getByRole('button', { name: /Approve/i });
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
    }

    // Verify it is now in the approved state (has a Check icon / "Approved" text)
    await expect(suggestedSource.getByText('Approved')).toBeVisible();

    // Navigate to Documents Intake
    await page.goto('/#documents');
    await expect(page.getByRole('heading', { name: /Document Intake/i })).toBeVisible();

    // Run extraction
    await page.getByRole('button', { name: /Run Document Extraction/i }).click();

    // Wait for the success notice
    await expect(page.getByText(/Fetched and stored/i)).toBeVisible({ timeout: 15000 });

    // Verify the extracted document appears
    const extractedDoc = page.locator('[data-testid="document-card"]').filter({ hasText: /Mock E2E Article/i });
    await expect(extractedDoc.first()).toBeVisible();
    await expect(extractedDoc.first().getByText(/raw/i)).toBeVisible();
  });
});
