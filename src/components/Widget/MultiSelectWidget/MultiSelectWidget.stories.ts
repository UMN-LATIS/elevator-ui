import { Meta, StoryFn } from "@storybook/vue3";
import MultiSelectWidget from "./MultiSelectWidget.vue";
import mockAsset from "@/__mocks__/mockAsset";
import mockTemplate from "@/__mocks__/mockTemplate";
import { getWidgetPropsByFieldTitle } from "@/helpers/displayUtils";

export default {
  title: "Widgets/MultiSelectWidget",
  component: MultiSelectWidget,
} as Meta<typeof MultiSelectWidget>;

const Template: StoryFn<typeof MultiSelectWidget> = (args) => ({
  components: { MultiSelectWidget },
  setup() {
    return { args };
  },
  template: `
    <MultiSelectWidget v-bind="args">
    </MultiSelectWidget>
  `,
});

const field = "cascadeselect_1";
const widgetContents = mockAsset[field];
const widgetProps = getWidgetPropsByFieldTitle(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: widgetProps,
};
