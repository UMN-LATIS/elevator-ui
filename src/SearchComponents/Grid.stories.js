import Grid from "./Grid.vue";
import mockResults from "@/__mocks__/mockSearchResults.json";

export default {
  title: "Search/Grid",
  component: Grid,
  argTypes: {
    searchResult: {
      type: "object",
    },
  },
};

const Template = (args) => ({
  components: {
    Grid,
  },
  setup() {
    return {
      args,
    };
  },
  template: `<Grid v-bind="args"></Grid>`,
});
export const Default = Template.bind({});
Default.args = {
  searchResults: mockResults,
};
