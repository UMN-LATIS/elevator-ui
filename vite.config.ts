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
      // create one css stylesheet
      cssCodeSplit: false,

      // put in dist/manifest.json (default for vite@4),
      // not dist/.vite/manifest.json (default for vite@5)
      manifest: "manifest.json",
      rollupOptions: {
        input:
          mode === "test"
            ? path.resolve(__dirname, "index.html")
            : path.resolve(__dirname, "src/main.ts"),
      },
      sourcemap: mode !== "production",
    },
    server: {
      https: {
        cert: "./.cert/cert.pem",
        key: "./.cert/key.pem",
      },
      // proxy: false,
      proxy: {
        "/assets": env.VITE_API_PROXY_TARGET,
        "/api": {
          target: env.VITE_API_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          cookieDomainRewrite: "localhost",
        },
      },
    },
  };
});
