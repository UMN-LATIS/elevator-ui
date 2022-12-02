import { Meta, StoryFn } from "@storybook/vue3";
import SearchBar from "./SearchBar.vue";

export default {
  component: SearchBar,
} as Meta<typeof SearchBar>;

const Template: StoryFn<typeof SearchBar> = (args) => ({
  components: { SearchBar },
  setup() {
    return { args };
  },
  template: `
    <SearchBar v-bind="args">
    </SearchBar>
  `,
});

export const Default = Template.bind({});
Default.args = {};
