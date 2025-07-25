<template>
  <Link
    :href="href"
    :to="to"
    class="app-menu-item group w-full flex items-center pl-2 py-2 font-medium my-1 hover:no-underline focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-blue-100 hover:text-neutral-900"
    :class="{
      'is-current-page': isCurrentPage,
    }">
    <slot />
  </Link>
</template>
<script setup lang="ts">
import Link from "@/components/Link/Link.vue";

withDefaults(
  defineProps<{
    href?: string;
    to?: string;
    isCurrentPage?: boolean;
  }>(),
  { isCurrentPage: false, href: undefined, to: undefined }
);
</script>
<style scoped>
.app-menu-item {
  color: var(--app-appMenu-textColor);
}
.app-menu-item.is-current-page {
  background: var(--app-appMenu-currentPage-backgroundColor);
  color: var(--app-appMenu-currentPage-textColor);
}
</style>
