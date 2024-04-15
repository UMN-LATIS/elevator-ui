import { Meta, StoryFn } from "@storybook/vue3";
import AppHeader from "./AppHeader.vue";

export default {
  component: AppHeader,
} as Meta<typeof AppHeader>;

const Template: StoryFn<typeof AppHeader> = (args) => ({
  components: { AppHeader },
  setup() {
    return { args };
  },
  template: `
    <AppHeader v-bind="args">
    </AppHeader>
  `,
});

export const Default = Template.bind({});
