import UploadWidget from "./UploadWidget.vue";
import mockAsset from "../../__mocks__/mockAsset.json";
import mockTemplate from "../../__mocks__/mockTemplate.json";
import { getField } from "../../Helpers/displayUtils";

export default {
  title: "View/Widgets/UploadWidget",
  component: UploadWidget,
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
  components: { UploadWidget },
  setup() {
    return { args };
  },
  template: `<UploadWidget v-bind="args"></UploadWidget>`,
});

let field = "image_1";
let widgetContents = mockAsset[field];
let template = getField(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: template,
};
