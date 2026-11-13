import { defineConfig } from "vitest/config";

// Config propia de data/: evita que vitest use la de la raíz (solo contracts y engine).
export default defineConfig({ test: { include: ["test/**/*.test.ts"] } });
