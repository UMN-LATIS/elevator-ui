import Tuple from "./Tuple.vue";

import { Meta, StoryFn } from "@storybook/vue3";

export default {
  component: Tuple,
} as Meta<typeof Tuple>;

const Template: StoryFn<typeof Tuple> = (args) => ({
  components: { Tuple },
  setup() {
    return { args };
  },
  template: '<Tuple v-bind="args">{{ args.slot }}</Tuple>',
});

//👇 Each story then reuses that template
export const Default = Template.bind({});
Default.args = { label: "Creator", slot: "Frank Gehry" };

export const Inline = Template.bind({});
Inline.args = { label: "Creator", slot: "Frank Gehry", variant: "inline" };

export const ValueOnly = Template.bind({});
ValueOnly.args = {
  label: "Creator",
  slot: "Frank Gehry",
  variant: "value-only",
};
