import { Meta, StoryFn } from "@storybook/vue3";
import Avatar from "./Avatar.vue";

export default {
  component: Avatar,
} as Meta<typeof Avatar>;

const Template: StoryFn<typeof Avatar> = (args) => ({
  components: { Avatar },
  setup() {
    return { args };
  },
  template: `
    <Avatar v-bind="args">
    </Avatar>
  `,
});

export const Default = Template.bind({});
Default.args = {
  name: "Elaine Benes",
};
