import "../src/app.css";
import "@fontsource/material-icons";

import { app } from '@storybook/vue3';
import { createPinia } from 'pinia';

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
};
