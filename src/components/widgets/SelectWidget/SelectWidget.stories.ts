import { Meta, StoryFn } from "@storybook/vue3";
import SelectWidget from "./SelectWidget.vue";
import mockAsset from "@/__mocks__/mockAsset";
import mockTemplate from "@/__mocks__/mockTemplate";
import { getWidgetPropsByFieldTitle } from "@/Helpers/displayUtils";

export default {
  title: "Widgets/SelectWidget",
  component: SelectWidget,
} as Meta<typeof SelectWidget>;

const Template: StoryFn<typeof SelectWidget> = (args) => ({
  components: { SelectWidget },
  setup() {
    return { args };
  },
  template: `
    <SelectWidget v-bind="args">
    </SelectWidget>
  `,
});

const field = "globalsearch_1";
const widgetContents = mockAsset[field];
const widget = getWidgetPropsByFieldTitle(mockTemplate, field);

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
