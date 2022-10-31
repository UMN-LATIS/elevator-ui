import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import routes from "@/routes";
import config from "@/config";
import "./app.css";

const app = createApp(App);
const pinia = createPinia();
const router = createRouter({
  history: createWebHistory(config.base.path),
  routes,
});

app.use(pinia).use(router).mount("#app");
