import Link from "./Link.vue";
import mockTemplate from "../../__mocks__/mockTemplate";
import { getWidgetPropsByFieldTitle } from "@/Helpers/displayUtils";

export default {
  title: "Helpers/Link",
  component: Link,
  argTypes: {
    widget: {
      type: "object",
    },
    linkText: {
      type: "string",
    },
  },
};

const Template = (args) => ({
  components: { Link },
  setup() {
    return { args };
  },
  template: `<Link v-bind="args"></Link>`,
});

const field = "title_1";
const template = getWidgetPropsByFieldTitle(mockTemplate, field);

export const Default = Template.bind({});
Default.args = {
  linkText: "My Text",
  widget: template,
};
