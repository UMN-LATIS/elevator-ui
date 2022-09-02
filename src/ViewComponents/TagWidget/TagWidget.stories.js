import TagWidget from "./TagWidget.vue";
import mockAsset from "../../__mocks__/mockAsset";
import mockTemplate from "../../__mocks__/mockTemplate";
import { getWidgetByFieldTitle } from "../../Helpers/displayUtils";

export default {
  title: "View/Widgets/TagWidget",
  component: TagWidget,
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
  components: { TagWidget },
  setup() {
    return { args };
  },
  template: `<TagWidget v-bind="args"></TagWidget>`,
});

const field = "sometags_1";
const widgetContents = mockAsset[field];
const template = getWidgetByFieldTitle(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  contents: widgetContents,
  widget: template,
};

const templateWithLinks = JSON.parse(JSON.stringify(template));
templateWithLinks.clickToSearch = true;

export const ClickToSearch = Template.bind({});
ClickToSearch.args = {
  contents: widgetContents,
  widget: templateWithLinks,
};
