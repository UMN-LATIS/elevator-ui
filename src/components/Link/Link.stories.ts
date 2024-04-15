import { Meta, StoryFn } from "@storybook/vue3";
import Link from "./Link.vue";

export default {
  component: Link,
} as Meta<typeof Link>;

const Template: StoryFn<typeof Link> = (args) => ({
  components: { Link },
  setup() {
    return { args };
  },
  template: `
    <Link v-bind="args">
      {{ args.slot }}
    </Link>
  `,
});

export const Default = Template.bind({});
Default.args = {
  href: "https://umn.edu",
  slot: "This has an `href` prop and thus is an `<a>`",
};
export const AsRouterLink = Template.bind({});
AsRouterLink.args = {
  to: "/test",
  slot: "This has a `to` prop and thus is a `<RouterLink>`",
};
