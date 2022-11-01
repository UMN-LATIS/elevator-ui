import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  // this added so that dynamic components load properly on
  // production
  base: mode === "production" ? "/assets/elevator-ui/dist/" : "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      // https://rollupjs.org/guide/en/#big-list-of-options
      output: {
        assetFileNames: "assets/[name].[ext]",
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
      },
    },
    sourcemap: true,
  },
}));
