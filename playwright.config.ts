import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  timeout: 30_000,
  retries: 1,
  workers: 1,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  globalSetup: './playwright/global-setup.ts',
  // Start dev server before running E2E tests
  webServer: [
    {
      command: `E2E_TEST=1 python manage.py runserver 8001`,
      cwd: './backend',
      url: 'http://127.0.0.1:8001/health',
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: `VITE_E2E_TEST=true npx vite --host 127.0.0.1 --port 5174`,
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: true,
      timeout: 30_000,
    }
  ],
});
