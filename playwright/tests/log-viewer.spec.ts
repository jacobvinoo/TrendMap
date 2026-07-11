import { test, expect } from '@playwright/test';

test.describe('Streaming Log Viewer Modal', () => {
  test('Opens log viewer modal and streams data via SSE', async ({ page }) => {
    // Mock the SSE stream endpoint
    await page.route('**/api/logs/extraction/stream', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: Starting extraction...\n\ndata: Processed Gartner.\n\n',
      });
    });

    await page.goto('/#documents');
    
    // Check that the View Logs button is visible and click it
    const viewLogsBtn = page.getByRole('button', { name: 'View Logs' });
    await expect(viewLogsBtn).toBeVisible();
    await viewLogsBtn.click();

    // Verify modal opens
    const modalTitle = page.getByText('Extraction Logs', { exact: true });
    await expect(modalTitle).toBeVisible();

    // Verify streamed content appears in the log viewer
    const logOutput = page.locator('pre[data-testid="log-viewer-output"]');
    await expect(logOutput).toContainText('Starting extraction...');
    await expect(logOutput).toContainText('Processed Gartner.');
    
    // Close modal via dispatchEvent to avoid viewport issues
    await page.getByRole('button', { name: 'Close Extraction Logs' }).dispatchEvent('click');
    await expect(modalTitle).not.toBeVisible();
  });
});
