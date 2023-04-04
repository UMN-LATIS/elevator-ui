import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  console.log({ env });
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
    server: {
      proxy: {
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
