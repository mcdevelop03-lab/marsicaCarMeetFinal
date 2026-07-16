import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Solo la logica pura: niente ambiente DOM, niente componenti.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
