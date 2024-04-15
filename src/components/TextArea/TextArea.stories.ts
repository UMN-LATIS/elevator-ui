import { Meta, StoryFn } from "@storybook/vue3";
import TextArea from "./TextArea.vue";

export default {
  component: TextArea,
} as Meta<typeof TextArea>;

const Template: StoryFn<typeof TextArea> = (args) => ({
  components: { TextArea },
  setup() {
    return { args };
  },
  template: `
    <TextArea v-bind="args">
    </TextArea>
  `,
});

export const Default = Template.bind({});
Default.args = {};
