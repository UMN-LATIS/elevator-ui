import { Meta, StoryFn } from "@storybook/vue3";
import RelatedAssetWidget from "./RelatedAssetWidget.vue";

export default {
  component: RelatedAssetWidget,
} as Meta<typeof RelatedAssetWidget>;

const Template: StoryFn<typeof RelatedAssetWidget> = (args) => ({
  components: { RelatedAssetWidget },
  setup() {
    return { args };
  },
  template: `
    <RelatedAssetWidget v-bind="args">
    </RelatedAssetWidget>
  `,
});

export const Default = Template.bind({});
Default.args = {};
