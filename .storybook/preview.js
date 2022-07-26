import '../src/app.css';

import "@fontsource/material-icons";

window.baseURL = "https://dev.elevator.umn.edu/defaultinstance/"

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}