import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["contracts/**/*.test.ts", "engine/**/*.test.ts", "missions/**/*.test.ts", "agents/**/*.test.ts", "data/test/**/*.test.ts", "infra/**/*.test.ts"] },
});
