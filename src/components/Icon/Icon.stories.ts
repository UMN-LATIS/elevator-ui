import { Meta, StoryFn } from "@storybook/vue3";
import Icon from "./Icon.vue";

export default {
  component: Icon,
} as Meta<typeof Icon>;

const Template: StoryFn<typeof Icon> = (args) => ({
  components: { Icon },
  setup() {
    return { args };
  },
  template: `
    <Icon v-bind="args">
      {{ args.slot }}
    </Icon>
  `,
});

export const Default = Template.bind({});
Default.args = {
  slot: "favorite",
};
