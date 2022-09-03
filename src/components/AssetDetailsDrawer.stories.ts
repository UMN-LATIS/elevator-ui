import { Meta, StoryFn } from "@storybook/vue3";
import AssetDetails from "./AssetDetailsDrawer.vue";

export default {
  component: AssetDetails,
} as Meta<typeof AssetDetails>;

const Template: StoryFn<typeof AssetDetails> = (args) => ({
  components: { AssetDetails },
  setup() {
    return { args };
  },
  template: `
    <AssetDetails v-bind="args">
    </AssetDetails>
  `,
});

export const Default = Template.bind({});
Default.args = {
  assetId: "56a3bb007d58ae8a488b4657",
};
