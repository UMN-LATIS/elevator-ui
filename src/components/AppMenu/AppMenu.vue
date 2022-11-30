<template>
  <nav class="app-menu flex flex-col max-w-md p-8 border">
    <header class="py-4 flex">
      <h1 class="text-2xl font-bold">{{ instanceStore.instance.name }}</h1>
    </header>
    <div class="app-menu__items border-y border-transparent-black-200 py-4">
      <template v-for="item in navItems" :key="item.id">
        <div v-if="!item.children">
          <a
            href="#"
            :class="[
              item.isCurrentPage
                ? 'bg-gray-100 text-gray-900'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              'group w-full flex items-center pl-2 py-2 text-sm font-medium rounded-md my-1',
            ]"
          >
            {{ item.name }}
          </a>
        </div>
        <Disclosure v-else v-slot="{ open }" as="div" class="space-y-1">
          <DisclosureButton
            :class="[
              item.isCurrentPage
                ? 'bg-gray-100 text-gray-900'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              'group w-full flex items-center pl-2 pr-1 py-2 text-left text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 my-1',
            ]"
          >
            <span class="flex-1">{{ item.name }}</span>
            <svg
              :class="[
                open ? 'text-gray-400 rotate-90' : 'text-gray-300',
                'ml-3 h-5 w-5 flex-shrink-0 transform transition-colors duration-150 ease-in-out group-hover:text-gray-400',
              ]"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M6 6L14 10L6 14V6Z" fill="isCurrentPageColor" />
            </svg>
          </DisclosureButton>
          <DisclosurePanel class="space-y-1">
            <DisclosureButton
              v-for="subItem in item.children"
              :key="subItem.name"
              as="a"
              :href="subItem.href"
              class="group flex w-full items-center rounded-md py-2 pl-8 pr-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >{{ subItem.name }}</DisclosureButton
            >
          </DisclosurePanel>
        </Disclosure>
      </template>
    </div>
    <AppMenuFooter />
  </nav>
</template>
<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue";

import { useInstanceStore } from "@/stores/instanceStore";
import AppMenuFooter from "./AppMenuFooter.vue";
import config from "@/config";
import { Page } from "@/types";
import { computed } from "vue";

const instanceStore = useInstanceStore();

interface NavItem {
  id: number;
  name: string;
  href: string | null;
  isCurrentPage?: boolean;
  children?: NavItem[];
}

function getHrefForPage(page: Page) {
  return `${config.instance.base.url}/page/view/${page.id}`;
}

function toNavItemWithoutChildren(page: Page) {
  return {
    id: page.id,
    name: page.title,
    isCurrentPage: getHrefForPage(page) === window.location.href,
    href: page.children ? getHrefForPage(page) : null,
  };
}

const navItems = computed((): NavItem[] =>
  instanceStore.pages.map((page) => {
    const navItem = toNavItemWithoutChildren(page);

    if (!page.children) return navItem;

    return {
      ...navItem,
      children: [
        // the first page of the children group should be
        // the parent page
        navItem,
        // then all the child pages
        ...page.children.map(toNavItemWithoutChildren),
      ],
    };
  })
);

// const navigation = [
//   { name: "Dashboard", isCurrentPage: true, href: "#" },
//   {
//     name: "Team",
//     isCurrentPage: false,
//     children: [
//       { name: "Overview", href: "#" },
//       { name: "Members", href: "#" },
//       { name: "Calendar", href: "#" },
//       { name: "Settings", href: "#" },
//     ],
//   },
//   {
//     name: "Projects",
//     isCurrentPage: false,
//     children: [
//       { name: "Overview", href: "#" },
//       { name: "Members", href: "#" },
//       { name: "Calendar", href: "#" },
//       { name: "Settings", href: "#" },
//     ],
//   },
//   {
//     name: "Calendar",
//     isCurrentPage: false,
//     children: [
//       { name: "Overview", href: "#" },
//       { name: "Members", href: "#" },
//       { name: "Calendar", href: "#" },
//       { name: "Settings", href: "#" },
//     ],
//   },
//   {
//     name: "Documents",
//     isCurrentPage: false,
//     children: [
//       { name: "Overview", href: "#" },
//       { name: "Members", href: "#" },
//       { name: "Calendar", href: "#" },
//       { name: "Settings", href: "#" },
//     ],
//   },
//   {
//     name: "Reports",
//     isCurrentPage: false,
//     children: [
//       { name: "Overview", href: "#" },
//       { name: "Members", href: "#" },
//       { name: "Calendar", href: "#" },
//       { name: "Settings", href: "#" },
//     ],
//   },
// ];
</script>
<style scoped>
/* .app-menu {
  background: var(--app-menu-backgroundColor);
  color: var(--app-menu-textColor);
} */
</style>
