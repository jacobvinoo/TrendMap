import { test, expect } from '@playwright/test';

test.describe('Phase 4: Intelligence Hub Flow', () => {
  test('Agent Activity, Debate, and Predictions', async ({ page }) => {
    // 1. Visit Agent Activity
    await page.goto('/#agent-activity');
    await expect(page.getByRole('heading', { name: /Agent Activity Log/i })).toBeVisible();

    // Trigger Global Cycle
    const triggerBtn = page.getByRole('button', { name: /Trigger Global Cycle/i });
    await triggerBtn.click();
    
    // Wait for the cycle to indicate completion (or at least check that the success message appears)
    await expect(page.getByText(/Global cycle completed/i)).toBeVisible({ timeout: 15000 });

    // 2. Navigate to Agent Debate
    await page.goto('/#agent-debate');
    await expect(page.getByRole('heading', { name: /Agent Debate Console/i })).toBeVisible();

    // 3. Navigate to Prediction Timeline
    await page.goto('/#prediction-timeline');
    await expect(page.getByRole('heading', { name: /Prediction Timeline/i })).toBeVisible();
  });
});
