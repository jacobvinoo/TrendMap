import { test, expect } from '@playwright/test';

test.describe('Phase 2: Continuous Monitoring Flow', () => {
  test('Create Rule, Run Monitoring, and Check Dashboard', async ({ page }) => {
    // 1. Visit App
    await page.goto('/');

    // 2. Navigate to Monitoring configuration
    await page.goto('/#rules');
    await expect(page.getByRole('heading', { name: /Monitoring Configuration/i })).toBeVisible();

    // 3. Enable monitoring for a source (using the first available source in the list)
    // First, verify there's a source card
    await expect(page.locator('.bg-gray-800.border').first()).toBeVisible({ timeout: 10000 });
    
    // Enable monitoring
    const enableBtn = page.getByRole('button', { name: /Enable Monitoring/i }).first();
    await enableBtn.click();
    await expect(page.getByRole('button', { name: /Disable Monitoring/i }).first()).toBeVisible();

    // 4. Navigate to Dashboard
    await page.goto('/#dashboard');
    await expect(page.getByRole('heading', { name: /Monitoring Dashboard/i })).toBeVisible();

    // 5. Trigger Manual Run
    const runBtn = page.getByRole('button', { name: /Run Monitoring Now/i }).first();
    await runBtn.click();

    // 6. Wait for Summary
    await expect(page.getByText(/Found 3 new signals/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Review candidate trend/i).first()).toBeVisible();
    
    // Check Alerts screen
    await page.goto('/#alerts');
    await expect(page.getByRole('heading', { name: /System Alerts/i })).toBeVisible();
  });
});

