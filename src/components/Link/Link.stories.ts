import { Meta, StoryFn } from "@storybook/vue3";
import Link from "./Link.vue";
import mockTemplate from "@/__mocks__/mockTemplate";
import { getWidgetPropsByFieldTitle } from "@/helpers/displayUtils";

export default {
  component: Link,
} as Meta<typeof Link>;

const Template: StoryFn<typeof Link> = (args) => ({
  components: { Link },
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
