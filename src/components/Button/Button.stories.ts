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

export const Secondary = Template.bind({});
Secondary.args = { slot: "Secondary Button", variant: "secondary" };

export const Tertiary = Template.bind({});
Tertiary.args = { slot: "Tertiary Button", variant: "tertiary" };

export const WithIcon = Template.bind({});
WithIcon.args = {
  slot: "Button with Icon",
  icon: "arrow_forward",
};

export const AsLink = Template.bind({});
AsLink.args = {
  slot: "Link appears as Button",
  href: "https://umn.edu",
};
