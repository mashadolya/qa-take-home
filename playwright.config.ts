import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, DB_PATH, enabledBugs, PORT } from './e2e/common/utils/env.utils';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['github']]
    : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // One project per layer: `npm run e2e:api` = API + SQL, `npm run e2e:ui` = user journey in Chromium.
  projects: [
    { name: 'api', testMatch: /api\/tests\/.*\.spec\.ts$/ },
    { name: 'ui', testMatch: /ui\/tests\/.*\.spec\.ts$/, use: { ...devices['Desktop Chrome'] } },
  ],
  // The app always starts fresh (new SQLite file) with exactly the BUGS requested for this run,
  // so an already running instance is never reused.
  webServer: {
    command: 'node src/server.mjs',
    url: `${BASE_URL}/api/config`,
    reuseExistingServer: false,
    env: { PORT: String(PORT), DB_PATH, BUGS: enabledBugs.join(',') },
    stdout: 'pipe',
  },
});
