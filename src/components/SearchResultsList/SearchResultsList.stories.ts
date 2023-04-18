import { Meta, StoryFn } from "@storybook/vue3";
import SearchResultsList from "./SearchResultsList.vue";
import { mockSearchResults } from "@/__mocks__/mockObamaSpeechesCollection";

export default {
  component: SearchResultsList,
} as Meta<typeof SearchResultsList>;

const Template: StoryFn<typeof SearchResultsList> = (args) => ({
  components: { SearchResultsList },
  setup() {
    return { args };
  },
  template: `
    <SearchResultsList v-bind="args">
    </SearchResultsList>
  `,
});

export const Default = Template.bind({});
Default.args = {
  totalResults: 100,
  matches: mockSearchResults,
  status: "success",
};

export const Loading = Template.bind({});
Loading.args = {
  totalResults: undefined,
  matches: [],
  status: "fetching",
};
