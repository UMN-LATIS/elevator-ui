import SelectWidget from "./SelectWidget.vue";
import mockAsset from "../../__mocks__/mockAsset.json";
import mockTemplate from "../../__mocks__/mockTemplate.json";
import { getField } from "../../Helpers/displayUtils";

export default {
  title: "View/Widgets/SelectWidget",
  component: SelectWidget,
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
  components: { SelectWidget },
  setup() {
    return { args };
  },
  template: `<SelectWidget v-bind="args"></SelectWidget>`,
});

const field = "globalsearch_1";
const widgetContents = mockAsset[field];
const widget = getField(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: widget,
};

const widgetContentsWithMultipleValues = JSON.parse(
  JSON.stringify(widgetContents)
);
widgetContentsWithMultipleValues[0].fieldContents = ["option 1", "option 2"];

export const MultipleSelections = Template.bind({});
MultipleSelections.args = {
  contents: widgetContentsWithMultipleValues,
  widget: widget,
};

const widgetWithKVPairs = JSON.parse(JSON.stringify(widget));
widgetWithKVPairs.fieldData.selectGroup = {
  "option 1": "many values go here good friend",
  "option 2": "but some good here",
  "option 3": "any even more here",
};

export const KVPairs = Template.bind({});
KVPairs.args = {
  contents: widgetContentsWithMultipleValues,
  widget: widgetWithKVPairs,
};
