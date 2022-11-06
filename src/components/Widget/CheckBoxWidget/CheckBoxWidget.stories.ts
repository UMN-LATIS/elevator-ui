import { Meta, StoryFn } from "@storybook/vue3";
import CheckboxWidget from "./CheckboxWidget.vue";
import mockAsset from "@/__mocks__/mockAsset";
import mockTemplate from "@/__mocks__/mockTemplate";
import { getWidgetPropsByFieldTitle } from "@/helpers/displayUtils";

export default {
  title: "Widgets/CheckBoxWidget",
  component: CheckboxWidget,
} as Meta<typeof CheckboxWidget>;

const Template: StoryFn<typeof CheckboxWidget> = (args) => ({
  components: { CheckboxWidget },
  setup() {
    return { args };
  },
  template: `
    <CheckboxWidget v-bind="args" />
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
