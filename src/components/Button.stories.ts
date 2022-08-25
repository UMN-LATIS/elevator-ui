import Button from "./Button.vue";

import { Meta, StoryFn } from "@storybook/vue3";

export default {
  title: "Button",
  component: Button,
} as Meta<typeof Button>;

//👇 We create a “template” of how args map to rendering
const Template: StoryFn<typeof Button> = (args) => ({
  components: { Button },
  setup() {
    return { args };
  },
  template: '<Button v-bind="args">{{args.slot}}</Button>',
});

//👇 Each story then reuses that template
export const Primary = Template.bind({});
Primary.args = { slot: "Primary Button", variant: "primary" };
