import { Meta, StoryFn } from "@storybook/vue3";
import ThumbnailImage from "./ThumbnailImage.vue";

export default {
  component: ThumbnailImage,
} as Meta<typeof ThumbnailImage>;

const Template: StoryFn<typeof ThumbnailImage> = (args) => ({
  components: { ThumbnailImage },
  setup() {
    return { args };
  },
  template: `
    <ThumbnailImage v-bind="args">
    </ThumbnailImage>
  `,
});

export const Default = Template.bind({});
Default.args = {
  src: "/img/cat-unsplash.jpg",
  alt: "A cat",
};

export const WithLink = Template.bind({});
WithLink.args = {
  src: "/img/cat-unsplash.jpg",
  alt: "A cat",
  href: "https://www.reddit.com/r/aww/",
};

export const IsActive = Template.bind({});
IsActive.args = {
  src: "/img/cat-unsplash.jpg",
  alt: "A cat",
  href: "https://www.reddit.com/r/aww/",
  isActive: true,
};
