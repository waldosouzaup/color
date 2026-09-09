import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
const origin = "http://127.0.0.1:3301";
process.env.BETTER_AUTH_URL = origin;
process.env.E2E_PRODUCTION = "true";
export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: origin },
  webServer: {
    command: "node scripts/start.mjs",
    url: `${origin}/api/health`,
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      PORT: "3301",
      HOSTNAME: "127.0.0.1",
      BETTER_AUTH_URL: origin,
      APP_ENV: "test",
    },
  },
});
