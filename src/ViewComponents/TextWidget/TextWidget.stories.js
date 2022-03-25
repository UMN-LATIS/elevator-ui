import TextWidget from "./TextWidget.vue";
import mockAsset from "../../__mocks__/mockAsset.json";
import mockTemplate from "../../__mocks__/mockTemplate.json";
import { getField } from "../DisplayUtils.js";

export default {
  title: "View/Widgets/TextWidget",
  component: TextWidget,
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
  components: { TextWidget },
  setup() {
    return { args };
  },
  template: `<TextWidget v-bind="args"></TextWidget>`,
});

let field = "title_1"
let widget = mockAsset[field];
let template = getField(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
    contents: widget,
    template: template
};
