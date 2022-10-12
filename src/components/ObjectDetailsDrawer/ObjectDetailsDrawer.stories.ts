import { Meta, StoryFn } from "@storybook/vue3";
import ObjectDetails from "./ObjectDetailsDrawer.vue";

export default {
  component: ObjectDetails,
} as Meta<typeof ObjectDetails>;

const Template: StoryFn<typeof ObjectDetails> = (args) => ({
  components: { ObjectDetails },
  setup() {
    return { args };
  },
  template: `
    <ObjectDetails v-bind="args">
    </ObjectDetails>
  `,
});

export const Default = Template.bind({});
Default.args = {
  objectId: "56a3bb007d58ae8a488b4666",
  // for more like this
  assetId: "632dfcc223e48b6a531c8832",
};

export const WithNoObjectDetails = Template.bind({});
WithNoObjectDetails.args = {
  objectId: null,
  assetId: "632dfcc223e48b6a531c8832",
};

export const WithNoMoreLikeThis = Template.bind({});
WithNoMoreLikeThis.args = {
  objectId: "56a3bb007d58ae8a488b4666",
  assetId: null,
};

export const WithoutDetailedContentToShow = Template.bind({});
WithoutDetailedContentToShow.args = {
  objectId: null,
  assetId: null,
};
