import { Meta, StoryFn } from "@storybook/vue3";
import UploadWidget from "./UploadWidget.vue";
import mockAsset from "@/__mocks__/mockAsset";
import mockTemplate from "@/__mocks__/mockTemplate";
import { getWidgetPropsByFieldTitle } from "@/helpers/displayUtils";

export default {
  title: "Widgets/UploadWidget",
  component: UploadWidget,
} as Meta<typeof UploadWidget>;

const Template: StoryFn<typeof UploadWidget> = (args) => ({
  components: { UploadWidget },
  setup() {
    return { args };
  },
  template: `
    <UploadWidget v-bind="args">
    </UploadWidget>
  `,
});

const field = "image_1";
const widgetContents = mockAsset[field];
const template = getWidgetPropsByFieldTitle(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: template,
};
