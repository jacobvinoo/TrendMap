import { test, expect } from '@playwright/test';

test('E2E Continuous Monitoring Happy Path', async ({ page }) => {
  // 1. Visit App
  await page.goto('/');

  // 2. Navigate to Monitoring configuration
  await page.click('a[href="#monitoring"]');
  await expect(page.locator('h2')).toContainText('Monitoring Setup');

  // 3. Enable monitoring for a source
  // Assuming there's a source "Retail Dive" or similar that is approved
  const enableBtn = page.getByRole('button', { name: /Enable Monitoring/i }).first();
  await enableBtn.click();
  
  await expect(page.getByText('Monitoring Active')).toBeVisible();

  // 4. Navigate to Dashboard
  await page.click('a[href="#dashboard"]');
  await expect(page.locator('h1')).toContainText('Monitoring Dashboard');

  // 5. Trigger Manual Run
  const runBtn = page.getByRole('button', { name: /Run Monitoring Now/i }).first();
  await runBtn.click();

  // 6. Wait for Summary
  await expect(page.getByText(/Found \d+ new signal/i)).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/Review candidate trend/i)).toBeVisible();
});
