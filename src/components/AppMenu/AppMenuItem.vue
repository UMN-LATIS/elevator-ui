<template>
  <Link
    :href="href"
    :to="to"
    :class="
      cn(
        'app-menu-item group w-full flex items-center pl-2 py-2 font-medium my-1 hover:no-underline focus:outline-none focus:ring-2',
        {
          'is-current-page': isCurrentPage,
        },
        $attrs.class as string | undefined
      )
    ">
    <slot />
  </Link>
</template>
<script setup lang="ts">
import Link from "@/components/Link/Link.vue";
import { cn } from "@/lib/utils";

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
  color: var(--app-appMenuItem-textColor);

  &:hover,
  &:focus,
  &:focus-within {
    background: var(
      --app-appMenuItem-hover-backgroundColor,
      var(--color-blue-50)
    );
    color: var(--app-appMenuItem-hover-textColor, var(--color-blue-600));
  }
}
.app-menu-item.is-current-page {
  background: var(
    --app-appMenu-currentPage-backgroundColor,
    var(--color-blue-100)
  );
  color: var(--app-appMenu-currentPage-textColor, var(--color-blue-700));
}
</style>
