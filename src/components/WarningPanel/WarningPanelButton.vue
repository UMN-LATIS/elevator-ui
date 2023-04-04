<template>
  <Link
    :href="href"
    class="uppercase font-medium text-xs p-2 -ml-2 rounded-md inline-flex items-center hover:bg-blue-100 hover:no-underline"
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
