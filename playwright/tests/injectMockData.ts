import { Page } from '@playwright/test';

export async function injectMockData(page: Page) {
  await page.route('**/*', async (route) => {
    await route.continue();
  });
}
