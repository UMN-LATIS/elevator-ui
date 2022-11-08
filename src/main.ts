import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import router from "@/router";
import "@fontsource/work-sans/400.css";
import "@fontsource/work-sans/400-italic.css";
import "@fontsource/work-sans/600.css";
import "@fontsource/work-sans/600-italic.css";

import "./css/app.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia).use(router).mount("#app");
