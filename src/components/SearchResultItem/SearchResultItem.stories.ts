import { Meta, StoryFn } from "@storybook/vue3";
import SearchResultItem from "./SearchResultItem.vue";
import mockResults from "@/__mocks__/mockSearchResults";

export default {
  component: SearchResultItem,
} as Meta<typeof SearchResultItem>;

const Template: StoryFn<typeof SearchResultItem> = (args) => ({
  components: { SearchResultItem },
  setup() {
    return { args };
  },
  template: `
    <SearchResultItem v-bind="args">
    </SearchResultItem>
  `,
});

export const Default = Template.bind({});
Default.args = {
  searchResult: mockResults.matches[0],
};
