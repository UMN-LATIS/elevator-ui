import { Meta, StoryFn } from "@storybook/vue3";
import DrawerHeading from "@/components/DrawerHeading.vue";

export default {
  component: DrawerHeading,
} as Meta<typeof DrawerHeading>;

const Template: StoryFn<typeof DrawerHeading> = (args) => ({
  components: { DrawerHeading },
  setup() {
    return { args };
  },
  template: `
    <DrawerHeading v-bind="args">
      {{ args.slot }}
    </DrawerHeading>
  `,
});

export const Default = Template.bind({});
Default.args = {
  slot: "Drawer Heading",
};
