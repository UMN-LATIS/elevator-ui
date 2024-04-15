import { Meta, StoryFn } from "@storybook/vue3";
import ThemeSelector from "./ThemeSelector.vue";

export default {
  component: ThemeSelector,
} as Meta<typeof ThemeSelector>;

const Template: StoryFn<typeof ThemeSelector> = (args) => ({
  components: { ThemeSelector },
  setup() {
    return { args };
  },
  template: `
    <ThemeSelector v-bind="args">
    </ThemeSelector>
  `,
});

export const Default = Template.bind({});
Default.args = {};
