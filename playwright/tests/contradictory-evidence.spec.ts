import { test, expect } from '@playwright/test';

test('E2E Contradictory Evidence and Alerts Path', async ({ page }) => {
  // 1. Visit App
  await page.goto('/');

  // 2. We assume the backend simulation has generated a contradictory scenario
  // Navigate directly to the Alerts tab
  await page.goto('/#alerts');
  await expect(page.locator('h1')).toContainText('System Alerts');

  // 3. Filter by Severity
  const filterSelect = page.getByRole('combobox', { name: /Filter by Severity/i });
  await filterSelect.selectOption('warning');

  // 4. Verify Anomaly alert exists
  // Expecting an anomaly alert for dropped momentum
  await expect(page.getByText(/Anomaly Detected/i).first()).toBeVisible();
  
  // 5. Acknowledge Alert
  const ackBtn = page.getByRole('button', { name: /Acknowledge/i }).first();
  await ackBtn.click();
  
  // 6. Navigate to Trends and check history
  await page.getByRole('button', { name: /Phase 1: Discover/i }).click();
  await page.getByRole('button', { name: 'Trends', exact: true }).click();
  const detailsBtn = page.getByRole('button', { name: /Details/i }).first();
  if (await detailsBtn.isVisible()) {
    await detailsBtn.click();
    await expect(page.getByText('Score History Timeline')).toBeVisible();
    await expect(page.getByText(/Conf:/i).first()).toBeVisible();
  }
});
