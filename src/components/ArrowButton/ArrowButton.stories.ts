import { Meta, StoryFn } from "@storybook/vue3";
import ArrowButton from "./ArrowButton.vue";

export default {
  component: ArrowButton,
} as Meta<typeof ArrowButton>;

const Template: StoryFn<typeof ArrowButton> = (args) => ({
  components: { ArrowButton },
  setup() {
    return { args };
  },
  template: `
    <ArrowButton v-bind="args">
    </ArrowButton>
  `,
});

export const Default = Template.bind({});
Default.args = {};
