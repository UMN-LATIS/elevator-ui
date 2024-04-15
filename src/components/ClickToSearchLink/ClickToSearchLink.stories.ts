import { Meta, StoryFn } from "@storybook/vue3";
import ClickToSearchLink from "./ClickToSearchLink.vue";
import mockTemplate from "@/__mocks__/mockTemplate";
import { getWidgetPropsByFieldTitle } from "@/helpers/displayUtils";

export default {
  component: ClickToSearchLink,
} as Meta<typeof ClickToSearchLink>;

const Template: StoryFn<typeof ClickToSearchLink> = (args) => ({
  components: { Link: ClickToSearchLink },
  setup() {
    return { args };
  },
  template: `
    <Link v-bind="args">
    </Link>
  `,
});

const field = "title_1";
const template = getWidgetPropsByFieldTitle(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  linkText: "My Text",
  widget: template,
};
