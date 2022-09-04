import { Meta, StoryFn } from "@storybook/vue3";
import TagWidget from "./TagWidget.vue";
import mockAsset from "@/__mocks__/mockAsset";
import mockTemplate from "@/__mocks__/mockTemplate";
import { getWidgetPropsByFieldTitle } from "@/Helpers/displayUtils";

export default {
  component: TagWidget,
} as Meta<typeof TagWidget>;

const Template: StoryFn<typeof TagWidget> = (args) => ({
  components: { TagWidget },
  setup() {
    return { args };
  },
  template: `
    <TagWidget v-bind="args">
    </TagWidget>
  `,
});

const field = "sometags_1";
const widgetContents = mockAsset[field];
const template = getWidgetPropsByFieldTitle(mockTemplate, field);

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
