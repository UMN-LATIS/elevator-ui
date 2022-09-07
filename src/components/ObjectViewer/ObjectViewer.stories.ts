import { Meta, StoryFn } from "@storybook/vue3";
import ObjectViewer from "./ObjectViewer.vue";

export default {
  component: ObjectViewer,
} as Meta<typeof ObjectViewer>;

const Template: StoryFn<typeof ObjectViewer> = (args) => ({
  components: { ObjectViewer },
  setup() {
    return { args };
  },
  template: `
    <ObjectViewer v-bind="args">
    </ObjectViewer>
  `,
});

export const Default = Template.bind({});
Default.args = {
  objectId: "56a3bb007d58ae8a488b4666",
};
