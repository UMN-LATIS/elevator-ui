<template>
  <div>
    <AppMenuPure
      :instance="instanceStore.instance"
      :navItems="navItems"
      :currentUser="instanceStore.currentUser"
      @close="$emit('close')"
    />
  </div>
</template>
<script setup lang="ts">
import { useInstanceStore } from "@/stores/instanceStore";
import config from "@/config";
import { Page, NavItem } from "@/types";
import { computed } from "vue";
import AppMenuPure from "./AppMenuPure.vue";
import * as navItemFactory from "./navItemFactory";

defineEmits<{
  (eventName: "close"): void;
}>();

const instanceStore = useInstanceStore();

/**
 * normalizes the page data from the api
 */
function toNavItemWithoutChildren(page: Page): NavItem {
  const href = `${config.instance.base.url}/page/view/${page.id}`;
  return {
    id: page.id,
    name: page.title,
    isCurrentPage: href === window.location.href,
    href,
  };
}

const navItems = computed((): NavItem[] => {
  const { pages, currentUser, instance } = instanceStore;

  const pageNavItems = pages.map((page) => {
    const parentNavItem = toNavItemWithoutChildren(page);

    if (!page.children || page.children.length === 0) {
      return parentNavItem;
    }

    return {
      ...parentNavItem,
      children: [
        // the first page of the children group should be
        // the parent page, then all the child pages follow
        parentNavItem,
        ...page.children.map(toNavItemWithoutChildren),
      ],
    };
  });

  const adminNavItem = navItemFactory.createAdminMenu({
    instance,
    currentUser,
  });
  const editNavItem = navItemFactory.createEditMenu({ currentUser });
  const helpNavItem = navItemFactory.createHelpMenu({ instance });

  return [
    ...pageNavItems,
    navItemFactory.createCollectionsNavItem(),
    navItemFactory.createDrawersNavItem(),
    // this spread stuff will add an item only if it's truthy
    ...(editNavItem ? [editNavItem] : []),
    ...(adminNavItem ? [adminNavItem] : []),
    ...(helpNavItem ? [helpNavItem] : []),
  ];
});
</script>
<style scoped>
.app-menu {
  background: var(--app-menu-backgroundColor);
  color: var(--app-menu-textColor);
}
</style>
