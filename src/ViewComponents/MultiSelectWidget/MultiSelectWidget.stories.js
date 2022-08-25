import MultiSelectWidget from "./MultiSelectWidget.vue";
import mockAsset from "../../__mocks__/mockAsset.json";
import mockTemplate from "../../__mocks__/mockTemplate.json";
import { getField } from "../../Helpers/displayUtils";

export default {
  title: "View/Widgets/MultiSelectWidget",
  component: MultiSelectWidget,
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
  components: { MultiSelectWidget },
  setup() {
    return { args };
  },
  template: `<MultiSelectWidget v-bind="args"></MultiSelectWidget>`,
});

const field = "cascadeselect_1";
const widgetContents = mockAsset[field];
const template = getField(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: template,
};
