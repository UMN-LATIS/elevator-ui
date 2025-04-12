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
      manifest: true,
      rollupOptions: {
        input: "src/main.ts",
      },
      sourcemap: mode !== "production",
    },
    server: {
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
