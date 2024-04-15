import { Meta, StoryFn } from "@storybook/vue3";
import SkeletonCard from "./SkeletonCard.vue";

export default {
  component: SkeletonCard,
} as Meta<typeof SkeletonCard>;

const Template: StoryFn<typeof SkeletonCard> = (args) => ({
  components: { SkeletonCard },
  setup() {
    return { args };
  },
  template: `
    <SkeletonCard v-bind="args" class="max-w-md" />
  `,
});

export const Default = Template.bind({});
Default.args = {};
