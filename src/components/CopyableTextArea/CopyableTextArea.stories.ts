import { Meta, StoryFn } from "@storybook/vue3";
import CopyableTextArea from "./CopyableTextArea.vue";

export default {
  component: CopyableTextArea,
} as Meta<typeof CopyableTextArea>;

const Template: StoryFn<typeof CopyableTextArea> = (args) => ({
  components: { CopyableTextArea },
  setup() {
    return { args };
  },
  template: `
    <CopyableTextArea v-bind="args">
    </CopyableTextArea>
  `,
});

export const Default = Template.bind({});
Default.args = {};
