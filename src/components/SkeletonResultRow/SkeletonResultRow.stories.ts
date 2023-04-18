import { Meta, StoryFn } from "@storybook/vue3";
import SkeletonResultRow from "./SkeletonResultRow.vue";

export default {
  component: SkeletonResultRow,
} as Meta<typeof SkeletonResultRow>;

const Template: StoryFn<typeof SkeletonResultRow> = (args) => ({
  components: { SkeletonResultRow },
  setup() {
    return { args };
  },
  template: `
    <SkeletonResultRow v-bind="args">
    </SkeletonResultRow>
  `,
});

export const Default = Template.bind({});
Default.args = {};
