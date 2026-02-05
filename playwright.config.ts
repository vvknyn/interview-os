import { defineConfig, devices } from '@playwright/test';

/**
 * Intervu E2E Test Configuration
 *
 * Test Groups:
 * - NAV: Navigation tests
 * - AUTH: Authentication tests
 * - DASH: Dashboard/Interview Prep tests
 * - RESUME: Resume Builder tests
 * - TAILOR: Resume Tailor tests
 * - APPS: Application Tracker tests
 * - SETTINGS: Settings page tests
 * - MOBILE: Mobile responsive tests
 */

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry once locally
  workers: process.env.CI ? 1 : 3, // Limit workers to 3 locally
  timeout: 60000, // 60s timeout per test
  outputDir: 'test-output',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev', // Use dev for local testing
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
