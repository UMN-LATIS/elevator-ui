import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import router from "@/router";
import "@fontsource/work-sans/400.css";
import "@fontsource/work-sans/400-italic.css";
import "@fontsource/work-sans/500.css";
import "@fontsource/work-sans/500-italic.css";
import "@fontsource/work-sans/600.css";
import "@fontsource/work-sans/600-italic.css";

import "./css/app.css";
import { useInstanceStore } from "./stores/instanceStore";

async function init() {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia).use(router);

  // load instance store before mounting app
  // this prevents a race conditiion where the search store
  // tries to add search field filters before the instance store
  // has returned specifics about the available search fields
  const instanceStore = useInstanceStore(pinia);
  await instanceStore.init();

  app.mount("#app");
}

init();
