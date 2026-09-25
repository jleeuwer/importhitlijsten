import { defineConfig } from '@playwright/test';

const port = Number(process.env.E2E_PORT || process.env.PORT || 3003);
const host = process.env.E2E_HOST || '127.0.0.1';
const baseURL = process.env.E2E_BASE_URL || `http://${host}:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL
  },
  webServer: {
    command: `bash -lc 'mkdir -p logs && cross-env NODE_ENV=test PORT=${port} tsx server.js 2>&1 | tee logs/e2e-server-$(date +%Y%m%d-%H%M%S).log'`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: true,
    timeout: 30_000,
    stdout: 'pipe',
    stderr: 'pipe'
  }
});
