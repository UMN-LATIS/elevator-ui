import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import path from "path";

const notATest = [
  "tests/e2e/**",
  "node_modules/**",
  "dist/**",
  ".{idea,git,cache,output,temp}/**",
  "{tmp,temp}/**",
];

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "happy-dom",
          // one fixed zone, so a date assertion means the same thing on
          // every machine
          env: { TZ: "UTC" },
          exclude: [...notATest, "**/*.tz.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "timezone",
          environment: "happy-dom",
          // east of UTC, where a UTC midnight is still the previous day
          // locally. Code that reads a UTC date through the local clock
          // reports the wrong calendar day here and nowhere in the unit
          // project.
          env: { TZ: "Europe/Berlin" },
          include: ["**/*.tz.test.ts"],
          exclude: notATest,
        },
      },
    ],
  },
});
