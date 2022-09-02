import TextWidget from "./TextWidget.vue";
import mockAsset from "../../__mocks__/mockAsset";
import mockTemplate from "../../__mocks__/mockTemplate";
import { getWidgetPropsByFieldTitle } from "../../Helpers/displayUtils";

export default {
  title: "View/Widgets/TextWidget",
  component: TextWidget,
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
  components: { TextWidget },
  setup() {
    return { args };
  },
  template: `<TextWidget v-bind="args"></TextWidget>`,
});

const field = "title_1";
const widgetContents = mockAsset[field];
const template = getWidgetPropsByFieldTitle(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: template,
};

const templateWithoutLink = JSON.parse(JSON.stringify(template));
const contentWithLink = JSON.parse(JSON.stringify(widgetContents));

templateWithoutLink.clickToSearch = false;
contentWithLink[0].fieldContents = "http://www.fun.com";

export const AutoLink = Template.bind({});
AutoLink.args = {
  contents: contentWithLink,
  widget: templateWithoutLink,
};
