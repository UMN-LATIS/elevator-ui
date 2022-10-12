import { Meta, StoryFn } from "@storybook/vue3";
import MediaCard from "./MediaCard.vue";

export default {
  component: MediaCard,
} as Meta<typeof MediaCard>;

const Template: StoryFn<typeof MediaCard> = (args) => ({
  components: { MediaCard },
  setup() {
    return { args };
  },
  template: `
    <MediaCard v-bind="args">
      <h1 class="text-lg font-bold">So cute!</h1>
      Lorem ipsum dolor sit amet netus sollicitudin porttitor condimentum integer. Pharetra leo luctus curabitur nisl id auctor habitasse mauris tristique auctor.
    </MediaCard>
  `,
});

export const Default = Template.bind({});
Default.args = {
  imgSrc: "/img/cat-unsplash.jpg",
  imgAlt: "A cat",
};
