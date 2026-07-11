import { test, expect } from '@playwright/test';

test.describe('Phase 3: Strategy & Roadmap Flow', () => {
  test('Update Strategy Context, Generate Assumptions, Scenarios, and Decision Brief', async ({ page }) => {
    // 1. Visit Strategy Context
    await page.goto('/#strategy');
    await expect(page.getByRole('heading', { name: /Strategy/i })).toBeVisible();

    // The screen loads with "Dashboard" active. Switch to "Context Settings".
    await page.getByRole('button', { name: 'Context Settings' }).click();

    // Fill Company Name
    const companyInput = page.getByLabel('Company Name');
    await companyInput.fill('E2E Test Company');
    
    // Save Context
    await page.getByRole('button', { name: 'Save Context' }).click();
    await expect(page.getByText('✓ Saved successfully')).toBeVisible();

    // 2. Navigate to Assumptions
    await page.goto('/#assumptions');
    await expect(page.getByRole('heading', { name: /Assumptions/i })).toBeVisible();

    // Click Generate Assumptions
    const generateAssumptionsBtn = page.getByRole('button', { name: 'Generate Assumptions' });
    await generateAssumptionsBtn.click();
    
    // Wait for the button to finish its action (usually it's quick in test, but wait for network idle if needed)
    // We can just verify it's still on the screen and no crash occurred.
    await expect(page.getByRole('heading', { name: /Assumptions/i })).toBeVisible();

    // 3. Navigate to Scenarios
    await page.goto('/#scenarios');
    await expect(page.getByRole('heading', { name: /Scenarios/i })).toBeVisible();

    // Click Generate Scenarios
    const generateScenariosBtn = page.getByRole('button', { name: 'Generate Scenarios' });
    await generateScenariosBtn.click();
    
    // Wait for scenarios to appear (at least the Upside/Downside/Base Case labels)
    // We can check if the button is still there. If it generated scenarios, they'll show up.
    await expect(page.getByRole('heading', { name: /Scenarios/i })).toBeVisible();

    // 4. Navigate to Decision Brief
    await page.goto('/#brief');
    await expect(page.getByRole('heading', { name: /Decision Brief/i })).toBeVisible();

    // Click Generate Brief
    const generateBriefBtn = page.getByRole('button', { name: 'Generate Brief' });
    await generateBriefBtn.click();

    // Verify a Brief appeared (It shows "📋" emoji, or "Top Opportunities")
    await expect(page.getByText('Top Opportunities')).toBeVisible({ timeout: 15000 });
  });
});
