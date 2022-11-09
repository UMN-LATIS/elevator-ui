import { Meta, StoryFn } from "@storybook/vue3";
import ThumbnailImagePlaceholder from "./ThumbnailImagePlaceholder.vue";

export default {
  component: ThumbnailImagePlaceholder,
} as Meta<typeof ThumbnailImagePlaceholder>;

const Template: StoryFn<typeof ThumbnailImagePlaceholder> = (args) => ({
  components: { ThumbnailImagePlaceholder },
  setup() {
    return { args };
  },
  template: `
    <ThumbnailImagePlaceholder />
  `,
});

export const Default = Template.bind({});
Default.args = {};
