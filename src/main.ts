import { createApp } from "vue";
import App from "./App.vue";
import { resetStorePlugin } from "@/stores/resetStorePlugin";
import { createPinia } from "pinia";
import router from "@/router";
import { VueQueryPlugin } from "@tanstack/vue-query";

import "@fontsource/work-sans/400.css";
import "@fontsource/work-sans/400-italic.css";
import "@fontsource/work-sans/500.css";
import "@fontsource/work-sans/500-italic.css";
import "@fontsource/work-sans/600.css";
import "@fontsource/work-sans/600-italic.css";

import "./css/app.css";

const app = createApp(App);
const pinia = createPinia();
pinia.use(resetStorePlugin);

app.use(router).use(pinia).use(VueQueryPlugin);

// error handler of last resort. It bails after 10 errors to avoid infinite loops.
let errorCount = 0;
let timeoutId: ReturnType<typeof setTimeout> | null = null;
app.config.errorHandler = (err, instance, info) => {
  const MAX_ERRORS = 10;
  errorCount++;
  console.error(`Error #${errorCount}:`, info, err);

  if (errorCount > MAX_ERRORS) {
    throw new Error("Too many errors - stopping to prevent loop");
  }

  // Reset error count after 10 seconds without errors
  if (!timeoutId) {
    timeoutId = setTimeout(() => {
      errorCount = 0;
      timeoutId = null;
    }, 10000);
  }
};

app.mount("#app");
