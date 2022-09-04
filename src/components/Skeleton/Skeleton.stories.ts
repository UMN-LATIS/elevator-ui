import { Meta, StoryFn } from "@storybook/vue3";
import Skeleton from "./Skeleton.vue";

export default {
  component: Skeleton,
} as Meta<typeof Skeleton>;

const Template: StoryFn<typeof Skeleton> = (args) => ({
  components: { Skeleton },
  setup() {
    return { args };
  },
  template: `
    <Skeleton v-bind="args">
    </Skeleton>
  `,
});

export const Default = Template.bind({});
Default.args = {};
