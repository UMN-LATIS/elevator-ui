import ViewContainer from "./ViewContainer.vue";
import mockAsset from "@/__mocks__/mockAsset.json";
import mockTemplate from "@/__mocks__/mockTemplate.json";

export default {
  title: "View/ViewContainer",
  component: ViewContainer,
  argTypes: {
    template: {
        type: "object",
    },
    asset: {
        type: "object"
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
    template: mockTemplate,
    asset: mockAsset
};
