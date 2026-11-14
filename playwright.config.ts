import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas e2e (rol infra). Si ya hay un servidor de la ui corriendo, define E2E_BASE_URL
 * y no se levanta nada. Si no, y existe `ui/package.json`, se arranca el servidor de Vite.
 */
const puerto = Number(process.env.E2E_PORT ?? 5173);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${puerto}`;
const hayUi = existsSync("ui/package.json");

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.ts",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    locale: "en-US", // el inglés es el idioma base
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer:
    hayUi && !process.env.E2E_BASE_URL
      ? {
          command: `npm --prefix ui run dev -- --host 127.0.0.1 --port ${puerto} --strictPort`,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        }
      : undefined,
});
