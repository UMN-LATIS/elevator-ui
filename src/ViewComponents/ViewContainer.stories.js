import ViewContainer from "./ViewContainer.vue";
import mockAsset from "../__mocks__/mockAsset.json";
import mockTemplate from "../__mocks__/mockTemplate.json";

export default {
  title: "View/ViewContainer",
  component: ViewContainer,
  argTypes: {
    asset: {
        type: "object",
    },
    template: {
      type: "object"
    },
    isPrimaryElement: {
        type: "boolean"
    }
  },
};

const Template = (args) => ({
  components: { ViewContainer },
  setup() {
    return { args };
  },
  template: `<ViewContainer v-bind="args"></ViewContainer>`,
});


export const Default = Template.bind({});
Default.args = {
  asset: mockAsset,
  template: mockTemplate,
  isPrimaryElement: true
};
