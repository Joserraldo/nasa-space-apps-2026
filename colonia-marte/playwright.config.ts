import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/visual",
  workers: 1,
  reporter: "list",
  use: { baseURL:"http://127.0.0.1:5190",headless:false,viewport:{width:1440,height:1000} },
});
