import { Meta, StoryFn } from "@storybook/vue3";
import Chip from "@/components/Chip.vue";

export default {
  component: Chip,
} as Meta<typeof Chip>;

const Template: StoryFn<typeof Chip> = (args) => ({
  components: { Chip },
  setup() {
    return { args };
  },
  template: '<Chip v-bind="args">{{ args.slot }}</Chip>',
});

export const Default = Template.bind({});
Default.args = {
  slot: "Keyword Name",
};

export const WithHref = Template.bind({});
WithHref.args = {
  slot: "Clickable Keyword",
  href: "https://umn.edu",
};
