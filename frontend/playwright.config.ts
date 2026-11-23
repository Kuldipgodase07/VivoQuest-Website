import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/parity',
  fullyParallel: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 14'], viewport: { width: 390, height: 844 } } },
  ],
});
