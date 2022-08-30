import TextAreaWidget from "./TextAreaWidget.vue";
import mockAsset from "../../__mocks__/mockAsset.json";
import mockTemplate from "../../__mocks__/mockTemplate.json";
import { getWidgetByField } from "../../Helpers/displayUtils";

export default {
  title: "View/Widgets/TextAreaWidget",
  component: TextAreaWidget,
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
  components: { TextAreaWidget },
  setup() {
    return { args };
  },
  template: `<TextAreaWidget v-bind="args"></TextAreaWidget>`,
});

const field = "bigtext_1";
const widgetContents = mockAsset[field];
const template = getWidgetByField(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: template,
};
