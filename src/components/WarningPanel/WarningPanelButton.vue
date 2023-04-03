<template>
  <Link
    :href="href"
    class="uppercase font-medium text-xs border border-yellow-700 p-2 rounded-md inline-flex items-center hover:bg-neutral-900 hover:border-neutral-900 hover:text-neutral-50 hover:no-underline"
    :class="{
      ' text-yellow-700 ': !isPrimary,
      ' bg-yellow-700 text-yellow-50 ': isPrimary,
    }"
  >
    <slot />
  </Link>
</template>
<script setup lang="ts">
import Link from "@/components/Link/Link.vue";

withDefaults(
  defineProps<{
    href?: string;
    isPrimary?: boolean;
  }>(),
  {
    isPrimary: false,
    href: "#!",
  }
);
</script>
<style scoped></style>
