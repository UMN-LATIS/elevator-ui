import { Meta, StoryFn } from "@storybook/vue3";
import AppMenuPure from "./AppMenuPure.vue";
import AppMenu from "./AppMenu.vue";

export default {
  component: AppMenuPure,
  parameters: {
    layout: "fullscreen",
  },
} as Meta<typeof AppMenuPure>;

const Template: StoryFn<typeof AppMenuPure> = (args) => ({
  components: { AppMenuPure, AppMenu },
  setup() {
    return { args };
  },
  template: `
    <AppMenuPure v-bind="args" />
  `,
});

export const Default = Template.bind({});
Default.args = {
  instance: {
    id: 7,
    name: "Digital Content Library",
    logoImg: {
      src: "https://dev.elevator.umn.edu/assets/instanceAssets/7.png",
      alt: "Digital Content Library logo",
    },
    useCentralAuth: true,
    centralAuthLabel: "University",
    contact: "dcl.umn.edu",
  },
  navItems: [
    {
      id: 1,
      name: "About",
      isCurrentPage: false,
      href: "#",
      children: [
        {
          id: 1,
          name: "About",
          isCurrentPage: false,
          href: "#",
        },
        {
          id: 3,
          name: "Submitting Content",
          isCurrentPage: false,
          href: "#",
        },
      ],
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: true,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
    {
      id: 5,
      name: "page two",
      isCurrentPage: false,
      href: "#",
    },
  ],
  currentUser: null,
};

export const LoggedIn = Template.bind({});
LoggedIn.args = {
  ...Default.args,
  currentUser: {
    id: 1,
    displayName: "John James McCollinson",
    isAdmin: false,
    isSuperAdmin: false,
    canManageDrawers: false,
    canManageAssets: false,
  },
};
