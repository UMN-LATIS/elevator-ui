import { Meta, StoryFn } from "@storybook/vue3";
import XButton from "./XButton.vue";

export default {
  component: XButton,
} as Meta<typeof XButton>;

const Template: StoryFn<typeof XButton> = (args) => ({
  components: { XButton },
  setup() {
    return { args };
  },
  template: `
    <XButton v-bind="args">
    </XButton>
  `,
});

export const Default = Template.bind({});
Default.args = {};
