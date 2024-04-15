import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [vue()],
    // this added so that dynamic components load properly on
    // production
    base: mode === "production" ? "/assets/elevator-ui/dist/" : "/",
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // config options
    css: {
      preprocessorOptions: {
        less: {
          // this is needed for timelineJS
          // without it vite will have problems resolving the icon
          // urls in the less files
          // see: https://github.com/vitejs/vite/issues/11382
          rewriteUrls: "all",
        },
      },
    },
    build: {
      manifest: true,
      rollupOptions: {
        input: "/src/main.ts",
      },
      sourcemap: true,
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
