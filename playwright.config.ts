import "dotenv/config";
import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 10000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
        (existsSync("/usr/bin/google-chrome")
          ? "/usr/bin/google-chrome"
          : undefined),
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "npm run dev",
    url: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/health`,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
