import { Meta, StoryFn } from "@storybook/vue3";
import SearchResultRow from "./SearchResultRow.vue";
import mockResults from "@/__mocks__/mockSearchResults";

export default {
  component: SearchResultRow,
  parameters: {
    backgrounds: {
      default: "neutral-200",
    },
  },
} as Meta<typeof SearchResultRow>;

const Template: StoryFn<typeof SearchResultRow> = (args) => ({
  components: { SearchResultRow },
  setup() {
    return { args };
  },
  template: `
    <SearchResultRow v-bind="args">
    </SearchResultRow>
  `,
});

export const Default = Template.bind({});
Default.args = {
  searchMatch: mockResults.matches[0],
};
