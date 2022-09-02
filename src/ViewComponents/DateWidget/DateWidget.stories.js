import DateWidget from "./DateWidget.vue";
import mockAsset from "../../__mocks__/mockAsset";
import mockTemplate from "../../__mocks__/mockTemplate";
import { getWidgetByFieldTitle } from "../../Helpers/displayUtils";

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

const field = "creation_1";
const widgetContents = mockAsset[field];
const template = getWidgetByFieldTitle(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: template,
};
