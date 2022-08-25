import DateWidget from "./DateWidget.vue";
import mockAsset from "../../__mocks__/mockAsset.json";
import mockTemplate from "../../__mocks__/mockTemplate.json";
import { getField } from "../../Helpers/displayUtils";

export default {
  title: "View/Widgets/DateWidget",
  component: DateWidget,
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
  components: { DateWidget },
  setup() {
    return { args };
  },
  template: `<DateWidget v-bind="args"></TextWidget>`,
});

let field = "creation_1";
let widgetContents = mockAsset[field];
let template = getField(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: template,
};
