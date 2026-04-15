import { createApp } from "vue";
import App from "./App.vue";
import { resetStorePlugin } from "@/stores/resetStorePlugin";
import { createPinia } from "pinia";
import router from "@/router";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { createAppQueryClient } from "@/queries/queryClient";

// Work Sans: weights 400 (regular) and 600 (semibold) only. Italic variants
// are omitted — italic is rare in the UI and the browser synthesizes it from
// the regular face. @fontsource ships `font-display: swap` by default.
import "@fontsource/work-sans/400.css";
import "@fontsource/work-sans/600.css";

import "./css/app.css";

const app = createApp(App);
const pinia = createPinia();
pinia.use(resetStorePlugin);

const queryClient = createAppQueryClient();

app.use(router).use(pinia).use(VueQueryPlugin, { queryClient }).mount("#app");
