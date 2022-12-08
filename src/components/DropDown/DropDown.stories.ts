import { Meta, StoryFn } from "@storybook/vue3";
import DropDown from "./DropDown.vue";
import DropDownItem from "./DropDownItem.vue";

export default {
  component: DropDown,
} as Meta<typeof DropDown>;

const Template: StoryFn<typeof DropDown> = (args) => ({
  components: { DropDown, DropDownItem },
  setup() {
    return { args };
  },
  template: `
    <DropDown v-bind="args">
      <DropDownItem>Item 1</DropDownItem>
      <DropDownItem>Item 2</DropDownItem>
      <DropDownItem :disabled="true">Disabled Item</DropDownItem>
      <DropDownItem>Item</DropDownItem>
    </DropDown>
  `,
});

export const Default = Template.bind({});
Default.args = {
  label: "Dropdown Label",
  alignment: "left",
};
