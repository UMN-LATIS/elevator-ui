import { Meta, StoryFn } from "@storybook/vue3";
import SearchResultsGrid from "./SearchResultsGrid.vue";
import { mockSearchResults } from "@/__mocks__/mockObamaSpeechesCollection";

export default {
  component: SearchResultsGrid,
} as Meta<typeof SearchResultsGrid>;

const Template: StoryFn<typeof SearchResultsGrid> = (args) => ({
  components: { SearchResultsGrid },
  setup() {
    return { args };
  },
  template: `
    <SearchResultsGrid v-bind="args">
    </SearchResultsGrid>
  `,
});

export const Default = Template.bind({});
Default.args = {
  totalResults: 1000,
  matches: mockSearchResults,
  status: "success",
};

export const Loading = Template.bind({});
Loading.args = {
  totalResults: undefined,
  matches: [],
  status: "fetching",
};
