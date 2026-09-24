import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same "@/..." alias as tsconfig.json, so tests import the way the app does.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // The logic under test is pure, so no DOM environment is needed.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
