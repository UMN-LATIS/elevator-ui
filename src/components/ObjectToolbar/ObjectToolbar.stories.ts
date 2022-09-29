import { Meta, StoryFn } from "@storybook/vue3";
import ObjectToolbar from "./ObjectToolbar.vue";

export default {
  component: ObjectToolbar,
} as Meta<typeof ObjectToolbar>;

const Template: StoryFn<typeof ObjectToolbar> = (args) => ({
  components: { ObjectToolbar },
  setup() {
    return { args };
  },
  template: `
    <ObjectToolbar v-bind="args">
    </ObjectToolbar>
  `,
});

export const Default = Template.bind({});
Default.args = {};
