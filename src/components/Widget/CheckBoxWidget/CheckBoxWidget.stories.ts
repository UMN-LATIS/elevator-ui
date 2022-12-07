import { Meta, StoryFn } from "@storybook/vue3";
import CheckBoxWidget from "./CheckBoxWidget.vue";
import mockAsset from "@/__mocks__/mockAsset";
import mockTemplate from "@/__mocks__/mockTemplate";
import { getWidgetPropsByFieldTitle } from "@/helpers/displayUtils";

export default {
  title: "Widgets/CheckBoxWidget",
  component: CheckBoxWidget,
} as Meta<typeof CheckBoxWidget>;

const Template: StoryFn<typeof CheckBoxWidget> = (args) => ({
  components: { CheckBoxWidget },
  setup() {
    return { args };
  },
  template: `
    <CheckBoxWidget v-bind="args" />
  `,
});

const field = "coolstuff_1";
const widgetContents = mockAsset[field];
const template = getWidgetPropsByFieldTitle(mockTemplate, field);

export const Checked = Template.bind({});
Checked.args = {
  contents: widgetContents,
  widget: template,
};

const widgetContentsUncheck = JSON.parse(JSON.stringify(widgetContents));
widgetContentsUncheck[0].fieldContents = false;
export const UnChecked = Template.bind({});
UnChecked.args = {
  contents: widgetContentsUncheck,
  widget: template,
};
