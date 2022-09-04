import { Meta, StoryFn } from "@storybook/vue3";
import DateWidget from "./DateWidget.vue";
import mockAsset from "@/__mocks__/mockAsset";
import mockTemplate from "@/__mocks__/mockTemplate";
import { getWidgetPropsByFieldTitle } from "@/Helpers/displayUtils";

export default {
  title: "Widgets/DateWidget",
  component: DateWidget,
} as Meta<typeof DateWidget>;

const Template: StoryFn<typeof DateWidget> = (args) => ({
  components: { DateWidget },
  setup() {
    return { args };
  },
  template: `
    <DateWidget v-bind="args">
    </DateWidget>
  `,
});

const field = "creation_1";
const widgetContents = mockAsset[field];
const template = getWidgetPropsByFieldTitle(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: template,
};
