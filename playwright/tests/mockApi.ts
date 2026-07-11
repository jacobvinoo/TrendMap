import { Page } from '@playwright/test';

export async function mockEmptyApi(page: Page) {
  // Mock industry profile to prevent setup screen
  await page.route(/.*\/api\/industry-profile.*/, async route => {
    await route.fulfill({ json: { 
      id: 'ind-test',
      name: 'Mock Industry',
      geography: 'Global',
      description: 'Mock Description',
      strategicPriorities: []
    }});
  });

  // Mock empty endpoints
  const emptyEndpoints = [
    /.*\/api\/sources.*/,
    /.*\/api\/documents.*/,
    /.*\/api\/signals.*/,
    /.*\/api\/trends.*/,
    /.*\/api\/insights.*/,
    /.*\/api\/evidence-links.*/
  ];

  for (const endpoint of emptyEndpoints) {
    await page.route(endpoint, async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: [] });
      } else {
        await route.continue();
      }
    });
  }
}
