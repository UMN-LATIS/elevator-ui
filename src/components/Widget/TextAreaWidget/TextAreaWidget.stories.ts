import { Meta, StoryFn } from "@storybook/vue3";
import TextAreaWidget from "./TextAreaWidget.vue";
import mockAsset from "@/__mocks__/mockAsset";
import mockTemplate from "@/__mocks__/mockTemplate";
import { getWidgetPropsByFieldTitle } from "@/helpers/displayUtils";

export default {
  title: "Widgets/TextAreaWidget",
  component: TextAreaWidget,
} as Meta<typeof TextAreaWidget>;

const Template: StoryFn<typeof TextAreaWidget> = (args) => ({
  components: { TextAreaWidget },
  setup() {
    return { args };
  },
  template: `
    <TextAreaWidget v-bind="args">
    </TextAreaWidget>
  `,
});

const field = "bigtext_1";
const widgetContents = mockAsset[field];
const template = getWidgetPropsByFieldTitle(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: template,
};
