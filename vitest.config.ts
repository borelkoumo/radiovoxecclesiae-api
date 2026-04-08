import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: [
        "src/scripts/**",
        "src/index.ts",
        "src/app.ts",
        "src/repositories/**",          // require live Firestore — covered by integration tests
        "src/types/**",                 // type-only files, no runtime logic
        "src/routes/**",               // thin wiring — covered by controller integration tests
        "src/middleware/auth.ts",      // stub pass-through — no logic to unit-test yet
        "src/middleware/request-logger.ts",
        "src/config/firebase.ts",      // requires live Firebase credentials
        "src/controllers/prayer.controller.ts",   // requires Firestore
        "src/schemas/prayer.schema.ts",           // Zod declaration, no branch logic
        "src/schemas/app-config.schema.ts",       // Zod declaration, no branch logic
        "dist/**",
        "**/*.test.ts",
        "vitest.config.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
