<template>
  <div>
    <AppMenuPure
      :instance="instanceStore.instance"
      :navItems="pageNavItems"
      :currentUser="instanceStore.currentUser"
      @close="$emit('close')"
    />
  </div>

  <!-- <nav class="app-menu flex flex-col w-md max-w-full p-8 border">
    <XButton class="absolute right-4 top-4" @click="$emit('close')" />
    <header class="flex mt-4 py-4">
      <h1 class="text-2xl font-bold">{{ instanceStore.instance.name }}</h1>
    </header>
    <AppMenuAuthSection class="py-4" />
    <div class="app-menu__items flex-1 my-4 py-4 border-y border-neutral-600">
      <ExpandableNavSection :navItems="pageNavItems" />
    </div>
    <AppMenuFooter />
  </nav> -->
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
