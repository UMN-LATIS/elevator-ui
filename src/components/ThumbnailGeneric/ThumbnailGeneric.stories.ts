import { Meta, StoryFn } from "@storybook/vue3";
import ThumbnailGeneric from "./ThumbnailGeneric.vue";

export default {
  component: ThumbnailGeneric,
} as Meta<typeof ThumbnailGeneric>;

const Template: StoryFn<typeof ThumbnailGeneric> = (args) => ({
  components: { ThumbnailGeneric },
  setup() {
    return { args };
  },
  template: `
    <ThumbnailGeneric />
  `,
});

export const Default = Template.bind({});
Default.args = {};
