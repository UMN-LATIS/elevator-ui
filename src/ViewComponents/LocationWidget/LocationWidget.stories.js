import LocationWidget from "./LocationWidget.vue";
import mockAsset from "../../__mocks__/mockAsset.json";
import mockTemplate from "../../__mocks__/mockTemplate.json";
import { getField } from "../../Helpers/displayUtils";

export default {
  title: "View/Widgets/LocationWidget",
  component: LocationWidget,
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
  components: { LocationWidget },
  setup() {
    return { args };
  },
  template: `<LocationWidget v-bind="args"></LocationWidget>`,
});

const field = "location_1";
const widgetContents = mockAsset[field];
const template = getField(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: template,
};

const widgetContentsNoLabel = JSON.parse(JSON.stringify(widgetContents));
widgetContentsNoLabel[0].locationLabel = "";
export const NoLabel = Template.bind({});
NoLabel.args = {
  contents: widgetContentsNoLabel,
  widget: template,
};

const widgetContentsNoAddress = JSON.parse(
  JSON.stringify(widgetContentsNoLabel)
);
widgetContentsNoAddress[0].address = "";
export const NoAddress = Template.bind({});
NoAddress.args = {
  contents: widgetContentsNoAddress,
  widget: template,
};
