import { Meta, StoryFn } from "@storybook/vue3";
import ActiveFileViewToolbar from "./ActiveFileViewToolbar.vue";

export default {
  component: ActiveFileViewToolbar,
} as Meta<typeof ActiveFileViewToolbar>;

const Template: StoryFn<typeof ActiveFileViewToolbar> = (args) => ({
  components: { ActiveFileViewToolbar },
  setup() {
    return { args };
  },
  template: `
    <ActiveFileViewToolbar v-bind="args">
    </ActiveFileViewToolbar>
  `,
});

export const Default = Template.bind({});
Default.args = {};
