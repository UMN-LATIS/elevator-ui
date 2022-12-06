<template>
  <template v-for="item in pageNavItems" :key="item.id">
    <div v-if="!item.children">
      <AppMenuItem :href="item.href" :isCurrentPage="item.isCurrentPage">
        {{ item.name }}
      </AppMenuItem>
    </div>

    <AppMenuGroup v-else :label="item.name">
      <AppMenuItem
        v-for="subItem in item.children"
        :key="subItem.name"
        :href="subItem.href"
        :isCurrentPage="subItem.isCurrentPage"
      >
        {{ subItem.name }}
      </AppMenuItem>
    </AppMenuGroup>
  </template>
</template>
<script setup lang="ts">
import { NavItem, Page } from "@/types";
import AppMenuGroup from "./AppMenuGroup.vue";
import AppMenuItem from "./AppMenuItem.vue";
import config from "@/config";
import { computed } from "vue";

const props = defineProps<{
  pages: Page[];
}>();

const BASE_URL = config.instance.base.url;

function getHrefForPage(page: Page): string {
  return `${BASE_URL}/page/view/${page.id}`;
}

function isCurrentPage(page: Page): boolean {
  return getHrefForPage(page) === window.location.href;
}

/**
 * Convert a page to a nav item
 */
function toNavItem(page: Page): NavItem {
  return {
    id: page.id,
    name: page.title,
    isCurrentPage: isCurrentPage(page),
    href: getHrefForPage(page),
  };
}

function convertPagesToNavItems(pages: Page[]): NavItem[] {
  return pages.map((page) => {
    const parentNavItem = toNavItem(page);

    if (!page.children || page.children.length === 0) {
      return parentNavItem;
    }

    return {
      ...parentNavItem,
      children: [
        // the first page of the children group should be
        // the parent page, then all the child pages follow
        parentNavItem,
        ...page.children.map(toNavItem),
      ],
    };
  });
}

const pageNavItems = computed((): NavItem[] =>
  convertPagesToNavItems(props.pages)
);
</script>
<style scoped></style>
