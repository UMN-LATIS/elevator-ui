import { ref } from "vue";
import { Meta, StoryFn } from "@storybook/vue3";
import MoreLikeThis from "./MoreLikeThis.vue";
import Button from "@/components/Button/Button.vue";
import mockSearchResults from "@/__mocks__/mockSearchResults";

export default {
  component: MoreLikeThis,
  parameters: {
    backgrounds: {
      default: "neutral-200",
    },
  },
} as Meta<typeof MoreLikeThis>;

const Template: StoryFn<typeof MoreLikeThis> = (args) => ({
  components: { MoreLikeThis, Button },
  setup() {
    const isOpen = ref(false);
    return { isOpen, mockSearchResults, args };
  },
  template: `
    <MoreLikeThis :items="mockSearchResults.matches" v-bind="args">
    </MoreLikeThis>
  `,
});

export const Default = Template.bind({});
Default.args = {
  // assetId: "632dfcc223e48b6a531c8832",
};
