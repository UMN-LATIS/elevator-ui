import TagWidget from "./TagWidget.vue";
import mockAsset from "../../__mocks__/mockAsset.json";
import mockTemplate from "../../__mocks__/mockTemplate.json";
import { getField } from "../../Helpers/displayUtils";

export default {
  title: "View/Widgets/TagWidget",
  component: TagWidget,
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
  components: { TagWidget },
  setup() {
    return { args };
  },
  template: `<TagWidget v-bind="args"></TagWidget>`,
});

let field = "sometags_1"
let widgetContents = mockAsset[field];
let template = getField(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
    contents: widgetContents,
    widget: template
};

let templateWithLinks = JSON.parse(JSON.stringify(template));
templateWithLinks.clickToSearch = true;

export const ClickToSearch = Template.bind({});
ClickToSearch.args = {
    contents: widgetContents,
    widget: templateWithLinks
};
