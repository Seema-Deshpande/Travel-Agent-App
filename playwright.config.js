import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5180",
    trace: "on-first-retry",
  },
  // Boot the Express backend (needed for the live smoke test) and the Vite
  // client. Mocked UI tests intercept /api/chat, so they don't hit the backend.
  webServer: [
    {
      command: "npm --prefix server start",
      url: "http://localhost:3001/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "npm --prefix client run dev",
      url: "http://localhost:5180",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
