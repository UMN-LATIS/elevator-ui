<template>
  <template v-for="item in pageNavItems" :key="item.id">
    <div v-if="!item.children">
      <AppMenuItem :to="item.href ?? '#'" :isCurrentPage="item.isCurrentPage">
        {{ item.name }}
      </AppMenuItem>
    </div>

    <AppMenuGroup v-else :label="item.name">
      <AppMenuItem
        v-for="subItem in item.children"
        :key="subItem.name"
        :to="subItem.href ?? '#'"
        :isCurrentPage="subItem.isCurrentPage"
      >
        {{ subItem.name }}
      </AppMenuItem>
    </AppMenuGroup>
  </template>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { NavItem, Page } from "@/types";
import AppMenuGroup from "./AppMenuGroup.vue";
import AppMenuItem from "./AppMenuItem.vue";
import config from "@/config";

const props = defineProps<{
  pages: Page[];
}>();

function isCurrentPage(page: Page): boolean {
  return (
    `${config.instance.base.path}/page/view/${page.id}` ===
    window.location.pathname
  );
}

/**
 * Convert a page to a nav item
 */
function toNavItem(page: Page): NavItem {
  return {
    id: page.id,
    name: page.title,
    isCurrentPage: isCurrentPage(page),
    href: `/page/view/${page.id}`,
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

// if pages or route change, recompute the nav items
// so that isCurrentPage is updated
const pageNavItems = ref<NavItem[]>([]);
const route = useRoute();

// only include pages that have `includeInNav` set to true
// in the AppMenu.
function getPagesIncludedInNav(pages) {
  return pages.filter((page) => page.includeInNav);
}

watch(
  [() => props.pages, () => route.path],
  () => {
    const pagesToShow = getPagesIncludedInNav(props.pages);
    pageNavItems.value = convertPagesToNavItems(pagesToShow);
  },
  { immediate: true }
);
</script>
<style scoped></style>
