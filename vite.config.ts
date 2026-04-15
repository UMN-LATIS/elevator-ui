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
        output: {
          // Isolated heavy libraries get their own chunk so they can be cached
          // independently from app code. Only libraries without app-shared
          // sub-imports belong here — don't chunk widely-shared deps.
          manualChunks: {
            maplibre: ["maplibre-gl", "@turf/circle"],
            timeline: ["@knight-lab/timelinejs"],
          },
        },
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
