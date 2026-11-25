import { defineConfig, devices } from "@playwright/test";

const API_PORT = 3001;
const WEB_PORT = 3101;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node ../../server.js",
      url: `http://127.0.0.1:${API_PORT}/api/health`,
      cwd: __dirname,
      env: {
        ...process.env,
        PORT: String(API_PORT),
        HOST: "127.0.0.1",
        NODE_ENV: "test",
        GEMINI_API_KEY: "",
        CORS_ORIGINS: `http://localhost:${WEB_PORT}`
      },
      reuseExistingServer: !process.env.CI,
      timeout: 30_000
    },
    {
      command: `npx next dev -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}/doctor`,
      cwd: __dirname,
      env: {
        ...process.env,
        API_ORIGIN: `http://127.0.0.1:${API_PORT}`,
        API_TIMEOUT_MS: "60000",
        NEXT_PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}`
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    }
  ]
});
