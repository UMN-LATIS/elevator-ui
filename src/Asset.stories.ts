import { Meta, StoryFn } from "@storybook/vue3";
import Asset from "./Asset.vue";

export default {
  component: Asset,
} as Meta<typeof Asset>;

const Template: StoryFn<typeof Asset> = (args) => ({
  components: { Asset },
  setup() {
    return { args };
  },
  template: `
    <Asset v-bind="args">
    </Asset>
  `,
});

export const Default = Template.bind({});
Default.args = {
  assetId: "56a3bb007d58ae8a488b4657",
};
