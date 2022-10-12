import { Meta, StoryFn } from "@storybook/vue3";
import SearchResultCard from "./SearchResultCard.vue";
import mockResults from "@/__mocks__/mockSearchResults";

export default {
  component: SearchResultCard,
} as Meta<typeof SearchResultCard>;

const Template: StoryFn<typeof SearchResultCard> = (args) => ({
  components: { SearchResultCard },
  setup() {
    return { args };
  },
  template: `
    <SearchResultCard v-bind="args">
    </SearchResultCard>
  `,
});

export const Default = Template.bind({});
Default.args = {
  searchMatch: mockResults.matches[0],
};
