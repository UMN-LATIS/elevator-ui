import { Meta, StoryFn } from "@storybook/vue3";
import AppLogoMark from "./AppLogoMark.vue";

export default {
  component: AppLogoMark,
} as Meta<typeof AppLogoMark>;

const Template: StoryFn<typeof AppLogoMark> = (args) => ({
  components: { AppLogoMark },
  setup() {
    return { args };
  },
  template: `
    <AppLogoMark v-bind="args">
    </AppLogoMark>
  `,
});

export const Default = Template.bind({});
Default.args = {};
