import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const raiz = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: { fs: { allow: [raiz] } },
  build: { outDir: "dist", emptyOutDir: true },
});
