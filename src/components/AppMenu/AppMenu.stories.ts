import { Meta, StoryFn } from "@storybook/vue3";
import AppMenu from "./AppMenu.vue";
import AppMenuItem from "./AppMenuItem.vue";
import AppMenuGroup from "./AppMenuGroup.vue";

export default {
  component: AppMenu,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof AppMenu>;

const Template: StoryFn<typeof AppMenu> = (args) => ({
  components: { AppMenu, AppMenuItem, AppMenuGroup },
  setup() {
    return { args };
  },
  template: `
    <AppMenu v-bind="args">
      <AppMenuItem to="/">Home</AppMenuItem>
      <AppMenuItem to="/about">About</AppMenuItem>
      <AppMenuItem to="/contact">Contact</AppMenuItem>
      <AppMenuGroup title="Collections">
        <AppMenuItem to="/collections/1">Collection 1</AppMenuItem>
        <AppMenuItem to="/collections/2">Collection 2</AppMenuItem>
        <AppMenuItem to="/collections/3">Collection 3</AppMenuItem>
      </AppMenuGroup>
      <AppMenuGroup title="Drawers">
        <AppMenuItem to="/drawers/1">Drawer 1</AppMenuItem>
        <AppMenuItem to="/drawers/2">Drawer 2</AppMenuItem>
        <AppMenuItem to="/drawers/3">Drawer 3</AppMenuItem>
      </AppMenuGroup>
    </AppMenu>
  `,
});

export const Default = Template.bind({});
Default.args = {};
