import { createApp } from "vue";
import App from "./App.vue";
import { resetStorePlugin } from "@/stores/resetStorePlugin";
import { createPinia } from "pinia";
import router from "@/router";
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

app.use(router).use(pinia).mount("#app");
