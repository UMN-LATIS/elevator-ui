import { Meta, StoryFn } from "@storybook/vue3";
import LocationWidget from "./LocationWidget.vue";
import mockAsset from "@/__mocks__/mockAsset";
import mockTemplate from "@/__mocks__/mockTemplate";
import { getWidgetPropsByFieldTitle } from "@/helpers/displayUtils";
import { LocationWidgetContent, LocationWidgetDef } from "@/types";

export default {
  title: "Widgets/LocationWidget",
  component: LocationWidget,
} as Meta<typeof LocationWidget>;

const Template: StoryFn<typeof LocationWidget> = (args) => ({
  components: { LocationWidget },
  setup() {
    return { args };
  },
  template: `
    <LocationWidget v-bind="args">
    </LocationWidget>
  `,
});

const field = "location_1";
const widgetContents = mockAsset[field] as LocationWidgetContent[];
const template = getWidgetPropsByFieldTitle<LocationWidgetDef>(
  mockTemplate,
  field
);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: template,
};

const widgetContentsNoLabel = structuredClone(widgetContents);
widgetContentsNoLabel[0].locationLabel = null;
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
