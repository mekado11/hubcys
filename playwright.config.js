import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5174",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 1000 },
        colorScheme: "light",
      },
    },
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        colorScheme: "light",
      },
    },
  ],
  webServer: {
    command:
      "npm run build:review && node node_modules/vite/bin/vite.js preview --outDir review-dist --port 5174 --host 127.0.0.1 --strictPort",
    port: 5174,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
