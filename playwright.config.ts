import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.SALONOMIA_E2E_PORT ?? 3010);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${port}`,
    env: { BETTER_AUTH_URL: `http://127.0.0.1:${port}` },
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile-320", use: { browserName: "chromium", viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true } },
    { name: "mobile-375", use: { browserName: "chromium", viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: "tablet-768", use: { browserName: "chromium", viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true } },
  ],
});
