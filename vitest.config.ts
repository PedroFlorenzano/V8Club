import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: { provider: "v8", reporter: ["text", "lcov"] },
    fileParallelism: false, // testes de integração compartilham banco
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
