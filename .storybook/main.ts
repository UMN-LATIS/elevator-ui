import type { StorybookViteConfig } from '@storybook/builder-vite';
import { mergeConfig } from 'vite';
const config: StorybookViteConfig = {
  async viteFinal(config, {
    configType
  }) {
    return mergeConfig(config, {
      // customize the Vite config here
      resolve: {
        alias: {
          "@": "/src"
        }
      }
    });
  },

  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions"],
  framework: "@storybook/vue3",
  core: {
    builder: "@storybook/builder-vite"
  },
  features: {
    storyStoreV7: true
  }
};
export default config;
