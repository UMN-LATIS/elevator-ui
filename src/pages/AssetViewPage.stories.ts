import { Meta, StoryFn } from "@storybook/vue3";
import AssetViewPage from "@/pages/AssetViewPage.vue";

export default {
  component: AssetViewPage,
} as Meta<typeof AssetViewPage>;

const Template: StoryFn<typeof AssetViewPage> = (args) => ({
  components: { AssetViewPage },
  setup() {
    return { args };
  },
  template: `
    <AssetViewPage v-bind="args">
    </AssetViewPage>
  `,
});

export const Default = Template.bind({});
Default.args = {
  assetId: "56a3bb007d58ae8a488b4657",
};
Default.parameters = {
  layout: "fullscreen",
};