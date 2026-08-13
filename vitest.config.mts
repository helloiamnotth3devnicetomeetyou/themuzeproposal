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
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    pool: "threads",
    maxWorkers: 2,
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
    coverage: {
      provider: "v8",
      clean: true,
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["test/**", "e2e/**", ".next/**", "src/**/*.test.{ts,tsx}"],
    },
  },
});
