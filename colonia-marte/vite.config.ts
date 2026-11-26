import { defineConfig } from "vitest/config";

export default defineConfig({
  server: { host: "127.0.0.1", port: 5190, strictPort: true },
  optimizeDeps: { entries: ["index.html"] },
  build: { target: "es2022" },
  test: { include: ["tests/unit/**/*.test.ts"], pool: "threads" },
});
