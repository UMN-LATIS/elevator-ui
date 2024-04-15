import TextAreaWidget from "./TextAreaWidget.vue";
import mockAsset from "../../__mocks__/mockAsset.json";
import mockTemplate from "../../__mocks__/mockTemplate.json";
import { getField } from "../../Helpers/displayUtils";

export default {
  title: "View/Widgets/TextAreaWidget",
  component: TextAreaWidget,
  argTypes: {
    widget: {
        type: "object",
    },
    contents: {
        type: "object"
    }
  },
};

const Template = (args) => ({
  components: { TextAreaWidget },
  setup() {
    return { args };
  },
  template: `<TextAreaWidget v-bind="args"></TextAreaWidget>`,
});

let field = "bigtext_1"
let widgetContents = mockAsset[field];
let template = getField(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
    contents: widgetContents,
    widget: template
};
