import RelatedAssetWidget from "./RelatedAssetWidget.vue";
import mockAsset from "../../__mocks__/mockAsset.json";
import mockTemplate from "../../__mocks__/mockTemplate.json";
import { getField } from "../../Helpers/displayUtils";

export default {
  title: "View/Widgets/RelatedAssetWidget",
  component: RelatedAssetWidget,
  argTypes: {
    widget: {
        type: "object",
    },
    contents: {
        type: "object"
    },
    asset: {
      type: "object"
    }
  },
};

const Template = (args) => ({
  components: { RelatedAssetWidget },
  setup() {
    return { args };
  },
  template: `<RelatedAssetWidget v-bind="args"></RelatedAssetWidget>`,
});

let field = "relatedstuff_1"
let widgetContents = mockAsset[field];
let template = getField(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
    contents: widgetContents,
    widget: template,
    asset: mockAsset
};

