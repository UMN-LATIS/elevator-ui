import Button from "./Button.vue";

import { Meta, StoryFn } from "@storybook/vue3";

export default {
  component: Button,
} as Meta<typeof Button>;

const Template: StoryFn<typeof Button> = (args) => ({
  components: { Button },
  setup() {
    return { args };
  },
  template: '<Button v-bind="args">{{args.slot}}</Button>',
});

export const Primary = Template.bind({});
Primary.args = {
  slot: "Primary Button",
  variant: "primary",
};

//👇 Each story then reuses that template
export const PrimaryIcon = Template.bind({});
PrimaryIcon.args = {
  slot: "Primary Button",
  variant: "primary",
  icon: "arrow_forward",
};

export const PrimaryIconLink = Template.bind({});
PrimaryIconLink.args = {
  slot: "Primary Link",
  variant: "primary",
  icon: "launch",
  href: "https://umn.edu",
};

export const Secondary = Template.bind({});
Secondary.args = { slot: "Secondary Button", variant: "secondary" };

export const Tertiary = Template.bind({});
Tertiary.args = { slot: "Tertiary Button", variant: "tertiary" };
