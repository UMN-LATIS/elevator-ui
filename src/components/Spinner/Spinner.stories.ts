import { Meta, StoryFn } from "@storybook/vue3";
import Spinner from "./Spinner.vue";

export default {
  component: Spinner,
} as Meta<typeof Spinner>;

const Template: StoryFn<typeof Spinner> = (args) => ({
  components: { Spinner },
  setup() {
    return { args };
  },
  template: `
    <Spinner v-bind="args">
    </Spinner>
  `,
});

export const Default = Template.bind({});
Default.args = {};
