import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [vue(), vueJsx()],
    base: mode === "production" ? "/assets/elevator-ui/dist/" : "/",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          rewriteUrls: "all",
        },
      },
    },
    build: {
      // split css per dynamic import so a route-lazy chunk's CSS travels with it
      cssCodeSplit: true,

      // 600 KB — the TextEditor chunk is legitimately large (Quill + plugins);
      // anything above this is signal worth investigating.
      chunkSizeWarningLimit: 600,

      // put in dist/manifest.json (default for vite@4),
      // not dist/.vite/manifest.json (default for vite@5)
      manifest: "manifest.json",
      rollupOptions: {
        input:
          mode === "test"
            ? path.resolve(__dirname, "index.html")
            : path.resolve(__dirname, "src/main.ts"),
        // No manualChunks here on purpose. We tried naming maplibre/timeline
        // chunks but Vite then treated them as first-class entry deps and
        // emitted <link rel="modulepreload"> for the JS plus a render-blocking
        // <link rel="stylesheet"> for the timeline CSS on every page load —
        // defeating the lazy import. Letting Rollup auto-chunk based on the
        // dynamic-import graph keeps these chunks behind their import() calls.
      },
      sourcemap: mode !== "production",
    },
    server: {
      // https: {
      //   cert: "./.cert/cert.pem",
      //   key: "./.cert/key.pem",
      // },
      // proxy: false,
      proxy: {
        "/assets": {
          target: env.VITE_API_PROXY_TARGET,
          changeOrigin: true,
          secure: false,
        },
        "/api": {
          target: env.VITE_API_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          cookieDomainRewrite: "localhost",
          // don't verify SSL certs in dev
          secure: false,
        },
      },
    },
  };
});
