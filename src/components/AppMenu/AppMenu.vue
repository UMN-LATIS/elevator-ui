<template>
  <div>
    <AppMenuPure
      :instance="instanceStore.instance"
      :navItems="pageNavItems"
      :currentUser="instanceStore.currentUser"
      @close="$emit('close')"
    />
  </div>
</template>
<script setup lang="ts">
import { useInstanceStore } from "@/stores/instanceStore";
// import AppMenuFooter from "./AppMenuFooter.vue";
import config from "@/config";
import { Page, NavItem } from "@/types";
import { computed } from "vue";
// import XButton from "@/components/XButton/XButton.vue";
// import ExpandableNavSection from "./ExpandableNavSection.vue";
// import AppMenuAuthSection from "./AppMenuAuthSection.vue";
import AppMenuPure from "./AppMenuPure.vue";

defineEmits<{
  (eventName: "close"): void;
}>();

const instanceStore = useInstanceStore();

function getHrefForPage(page: Page) {
  return `${config.instance.base.url}/page/view/${page.id}`;
}

function toNavItemWithoutChildren(page: Page) {
  return {
    id: page.id,
    name: page.title,
    isCurrentPage: getHrefForPage(page) === window.location.href,
    href: getHrefForPage(page),
  };
}

const pageNavItems = computed((): NavItem[] =>
  instanceStore.pages.map((page) => {
    const parentNavItem = toNavItemWithoutChildren(page);

    if (!page.children || page.children.length === 0) {
      return parentNavItem;
    }

    return {
      ...parentNavItem,
      children: [
        // the first page of the children group should be
        // the parent page
        parentNavItem,
        // then all the child pages
        ...page.children.map(toNavItemWithoutChildren),
      ],
    };
  })
);
</script>
<style scoped>
.app-menu {
  background: var(--app-menu-backgroundColor);
  color: var(--app-menu-textColor);
}
</style>
