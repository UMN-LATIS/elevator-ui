import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import path from "path";

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "happy-dom",
    // Exclude e2e tests from vitest
    exclude: [
      "tests/e2e/**",
      "node_modules/**",
      "dist/**",
      ".{idea,git,cache,output,temp}/**",
      "{tmp,temp}/**",
    ],
  },
});
