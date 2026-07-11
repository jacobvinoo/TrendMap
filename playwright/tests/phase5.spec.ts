import { test, expect } from '@playwright/test';

test.describe('Phase 5 Features E2E', () => {
  test('Semantic Search screen loads and works', async ({ page }) => {
    await page.goto('/#semantic-search');
    await expect(page.getByRole('heading', { name: /Semantic Search/i })).toBeVisible();
    
    const searchInput = page.getByPlaceholder(/Search for signals about/i);
    await searchInput.fill('Grocery');
    
    const searchButton = page.getByRole('button', { name: 'Search', exact: true });
    await searchButton.click();
    
    await expect(page.locator('text=/No search results yet|Search Results/i').first()).toBeVisible();
  });

  test('Data Health screen loads', async ({ page }) => {
    await page.goto('/#data-health');
    await expect(page.getByRole('heading', { name: /Data Health/i })).toBeVisible();
    
    // Should display status
    await expect(page.getByText(/Status/i)).toBeVisible();
  });
});
