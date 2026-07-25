import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": path.resolve(import.meta.dirname, "test/server-only.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["test/**", ".next/**"],
    },
  },
});
