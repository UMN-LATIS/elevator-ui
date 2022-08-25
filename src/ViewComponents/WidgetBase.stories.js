import WidgetBase from "./WidgetBase.vue";
import mockAsset from "../__mocks__/mockAsset.json";
import mockTemplate from "../__mocks__/mockTemplate.json";
import { getField } from "../Helpers/displayUtils";

export default {
  title: "View/WidgetBase",
  component: WidgetBase,
  argTypes: {
    widget: {
      type: "object",
    },
    contents: {
      type: "object",
    },
  },
};

const Template = (args) => ({
  components: { WidgetBase },
  setup() {
    return { args };
  },
  template: `<WidgetBase v-bind="args"></WidgetBase>`,
});

let field = "title_1";
let widgetContents = mockAsset[field];
let template = getField(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: template,
  asset: mockAsset,
};
