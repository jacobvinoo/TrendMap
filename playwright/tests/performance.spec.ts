import { test, expect } from '@playwright/test';

test.describe('Performance Testing', () => {
  const thresholds = {
    LCP: 2500, // Largest Contentful Paint should be under 2.5s
    FCP: 1800, // First Contentful Paint should be under 1.8s
    TTFB: 800, // Time to First Byte should be under 800ms
  };

  test('Dashboard load performance meets thresholds', async ({ page }) => {
    // Navigate to the app dashboard
    await page.goto('/');

    // Ensure the page has fully loaded
    await expect(page.getByRole('button', { name: 'Industry Setup', exact: true })).toBeVisible();

    // Evaluate performance metrics from the browser
    const metrics = await page.evaluate(() => {
      const paintMetrics = performance.getEntriesByType('paint');
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      const fcp = paintMetrics.find((m) => m.name === 'first-contentful-paint')?.startTime || 0;
      const ttfb = navEntry ? navEntry.responseStart - navEntry.requestStart : 0;
      
      // Calculate a rough LCP proxy if the LCP API is not fully available
      // or we can use the PerformanceObserver
      return new Promise<any>((resolve) => {
        let lcp = fcp;
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            lcp = lastEntry.startTime;
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          // Stop observing after a short delay
          setTimeout(() => {
            observer.disconnect();
            resolve({ fcp, ttfb, lcp });
          }, 1000);
        } catch (e) {
          resolve({ fcp, ttfb, lcp: fcp });
        }
      });
    });

    console.log(`Performance Metrics - FCP: ${metrics.fcp}ms, TTFB: ${metrics.ttfb}ms, LCP: ${metrics.lcp}ms`);

    expect(metrics.fcp).toBeLessThan(thresholds.FCP);
    expect(metrics.ttfb).toBeLessThan(thresholds.TTFB);
    expect(metrics.lcp).toBeLessThan(thresholds.LCP);
  });
});
