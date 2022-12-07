import { Meta, StoryFn } from "@storybook/vue3";
import AdvancedSearchForm from "./AdvancedSearchForm.vue";

export default {
  component: AdvancedSearchForm,
} as Meta<typeof AdvancedSearchForm>;

const Template: StoryFn<typeof AdvancedSearchForm> = (args) => ({
  components: { AdvancedSearchForm },
  setup() {
    return { args };
  },
  template: `
    <AdvancedSearchForm v-bind="args">
    </AdvancedSearchForm>
  `,
});

export const Default = Template.bind({});
Default.args = {};
