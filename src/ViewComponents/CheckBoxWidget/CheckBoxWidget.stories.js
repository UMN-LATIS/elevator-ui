import CheckBoxWidget from "./CheckBoxWidget.vue";
import mockAsset from "../../__mocks__/mockAsset";
import mockTemplate from "../../__mocks__/mockTemplate";
import { getWidgetPropsByFieldTitle } from "../../Helpers/displayUtils";

export default {
  title: "View/Widgets/CheckBoxWidget",
  component: CheckBoxWidget,
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
  components: { CheckBoxWidget },
  setup() {
    return { args };
  },
  template: `<CheckBoxWidget v-bind="args"></CheckBoxWidget>`,
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
