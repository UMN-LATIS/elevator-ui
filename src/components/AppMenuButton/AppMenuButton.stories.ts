import { Meta, StoryFn } from "@storybook/vue3";
import AppMenuButton from "./AppMenuButton.vue";

export default {
  component: AppMenuButton,
} as Meta<typeof AppMenuButton>;

const Template: StoryFn<typeof AppMenuButton> = (args) => ({
  components: { AppMenuButton },
  setup() {
    return { args };
  },
  template: `
    <AppMenuButton v-bind="args">
    </AppMenuButton>
  `,
});

export const Default = Template.bind({});
Default.args = {};
