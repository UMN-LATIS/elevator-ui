import SearchResultItem from "./SearchResultItem.vue";
import mockResults from "@/__mocks__/mockSearchResults.json";

export default {
  title: "Search/SearchResultItem",
  component: SearchResultItem,
  argTypes: {
    searchResult: {
      type: "object",
    },
  },
};

const Template = (args) => ({
  components: {
    SearchResultItem,
  },
  setup() {
    return {
      args,
    };
  },
  template: `<SearchResultItem v-bind="args"></SearchResultItem>`,
});
export const Default = Template.bind({});
Default.args = {
  searchResult: mockResults.matches[0],
};
