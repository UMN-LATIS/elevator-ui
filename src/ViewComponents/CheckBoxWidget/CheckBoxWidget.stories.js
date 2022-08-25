import CheckBoxWidget from "./CheckBoxWidget.vue";
import mockAsset from "../../__mocks__/mockAsset.json";
import mockTemplate from "../../__mocks__/mockTemplate.json";
import { getField } from "../../Helpers/displayUtils";

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

let field = "coolstuff_1";
let widgetContents = mockAsset[field];
let template = getField(mockTemplate, field);

export const Checked = Template.bind({});
Checked.args = {
  contents: widgetContents,
  widget: template,
};

let widgetContentsUncheck = JSON.parse(JSON.stringify(widgetContents));
widgetContentsUncheck[0].fieldContents = false;
export const UnChecked = Template.bind({});
UnChecked.args = {
  contents: widgetContentsUncheck,
  widget: template,
};
