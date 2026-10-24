import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Trace on failure makes CI failures debuggable without a re-run.
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    // Containerized runners (docker compose sandbox, CI) cannot launch a
    // sandboxed Chromium — these flags are required there and harmless elsewhere.
    launchOptions: {args: ['--no-sandbox', '--disable-dev-shm-usage']}
  },
  projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
  // In CI the production build is started on port 3000; locally an already
  // running dev server (`docker compose up`) is reused instead.
  webServer: {
    command: 'pnpm start',
    url: 'http://127.0.0.1:3000/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
