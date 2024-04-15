import { Meta, StoryFn } from "@storybook/vue3";
import InputGroup from "./InputGroup.vue";
import { SearchIcon, OptionsIcon } from "@/icons";
import KeyboardShortcut from "../KeyboardShortcut/KeyboardShortcut.vue";

export default {
  component: InputGroup,
} as Meta<typeof InputGroup>;

const Template: StoryFn<typeof InputGroup> = (args) => ({
  components: { InputGroup },
  setup() {
    return { args };
  },
  template: `
    <InputGroup v-bind="args">
    </InputGroup>
  `,
});

export const Default = Template.bind({});
Default.args = {
  label: "Label",
  placeholder: "Placeholder",
  id: "testInput",
};

export const WithIcon: StoryFn<typeof InputGroup> = (args) => ({
  components: { InputGroup, SearchIcon, KeyboardShortcut, OptionsIcon },
  setup() {
    return { args };
  },
  template: `
    <InputGroup v-bind="args">
      <template #prepend>
        <SearchIcon />
      </template>
      <template #append>
        <KeyboardShortcut>⌘K</KeyboardShortcut>
        <button class="ml-2"><OptionsIcon /></button>
      </template>
    </InputGroup>
  `,
});
