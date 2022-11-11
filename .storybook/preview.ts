import { app } from "@storybook/vue3";
import { createPinia } from "pinia";
import vueRouter from "storybook-vue3-router";
import "../src/css/app.css";

// allows usage of RouterLink in all stories
export const decorators = [vueRouter()];

const pinia = createPinia();

app.use(pinia);

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  backgrounds: {
    default: "white",
    values: [
      {
        name: "white",
        value: "#fff",
      },
      {
        name: "neutral-50",
        value: "#fafafa",
      },
      {
        name: "neutral-100",
        value: "#f5f5f5",
      },
      {
        name: "neutral-200",
        value: "#e5e5e5",
      },
      {
        name: "neutral-900",
        value: "#171717",
      },
    ],
  },
};
