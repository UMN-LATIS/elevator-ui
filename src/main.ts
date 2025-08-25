import { createApp } from "vue";
import App from "./App.vue";
import { resetStorePlugin } from "@/stores/resetStorePlugin";
import { createPinia } from "pinia";
import router from "@/router";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import { setGlobalQueryClient } from "@/queries/queryClientInstance";

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

// Create query client and make it available globally for router guards
const queryClient = new QueryClient();
setGlobalQueryClient(queryClient);

app.use(router).use(pinia).use(VueQueryPlugin, { queryClient }).mount("#app");
