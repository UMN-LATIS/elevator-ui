import { Meta, StoryFn } from "@storybook/vue3";
import KeyboardShortcut from "./KeyboardShortcut.vue";

export default {
  component: KeyboardShortcut,
} as Meta<typeof KeyboardShortcut>;

const Template: StoryFn<typeof KeyboardShortcut> = (args) => ({
  components: { KeyboardShortcut },
  setup() {
    return { args };
  },
  template: `
    <KeyboardShortcut v-bind="args">
    ⌘K
    </KeyboardShortcut>
  `,
});

export const Default = Template.bind({});
Default.args = {};
