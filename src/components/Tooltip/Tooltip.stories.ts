import { Meta, StoryFn } from "@storybook/vue3";
import Tooltip from "./Tooltip.vue";
import Button from "@/components/Button/Button.vue";

export default {
  component: Tooltip,
} as Meta<typeof Tooltip>;

const Template: StoryFn<typeof Tooltip> = (args) => ({
  components: { Tooltip, Button },
  setup() {
    return { args };
  },
  template: `
  <Tooltip v-bind="args">
    <Button variant="primary">Click for tooltip</Button>
  </Tooltip>
  `,
});

export const Default = Template.bind({});
Default.args = {
  content: "This is a simple text tooltip.",
};

export const UsingContentSlot: StoryFn<typeof Tooltip> = (args) => ({
  components: { Tooltip, Button },
  setup() {
    return { args };
  },
  template: `
  <Tooltip v-bind="args">
    <Button variant="primary">Click for tooltip</Button>
    <template #content>
      <h1 class="text-lg font-bold">Content</h1>
      <p>This is the Popper content 🍿</p>
    </template>
  </Tooltip>
  `,
});

UsingContentSlot.args = {};
