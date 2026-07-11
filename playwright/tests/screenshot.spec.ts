import { test, expect } from '@playwright/test';

test('take screenshots of signal modal', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  // Phase 1 -> Signals
  await page.getByRole('button', { name: 'Phase 1: Discover' }).click();
  await page.getByRole('button', { name: 'Signals' }).click();
  
  // Click the first signal to open detail modal
  const firstSignal = page.getByTestId('signal-card').first();
  await firstSignal.click();
  
  await page.waitForTimeout(500); // wait for modal to render
  await page.screenshot({ path: 'signal_detail_modal.png', fullPage: true });
});
