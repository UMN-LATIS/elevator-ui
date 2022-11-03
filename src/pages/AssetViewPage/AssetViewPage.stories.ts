import { Meta, StoryFn } from "@storybook/vue3";
import AssetViewPage from "./AssetViewPage.vue";

export default {
  component: AssetViewPage,
  parameters: {
    layout: "fullscreen",
  },
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

export const WithObjectIdHash = Template.bind({});
WithObjectIdHash.args = {
  assetId: "56a3bb007d58ae8a488b4657",
  objectId: "632dfcc223e48b6a531c8832",
};

export const MockAssetPage = Template.bind({});
MockAssetPage.args = {
  assetId: "623dee393392272653676222",
};

export const MetaDataOnly = Template.bind({});
MetaDataOnly.args = {
  assetId: "6334d6997591f67a5976fbd1",
};
