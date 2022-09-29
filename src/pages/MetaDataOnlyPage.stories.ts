import { Meta, StoryFn } from "@storybook/vue3";
import MetaDataOnlyPage from "./MetaDataOnlyPage.vue";

export default {
  component: MetaDataOnlyPage,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof MetaDataOnlyPage>;

const Template: StoryFn<typeof MetaDataOnlyPage> = (args) => ({
  components: { MetaDataOnlyPage },
  setup() {
    return { args };
  },
  template: `
    <MetaDataOnlyPage v-bind="args">
    </MetaDataOnlyPage>
  `,
});

export const Default = Template.bind({});
Default.args = {
  assetId: "56a3bb007d58ae8a488b465c",
};
