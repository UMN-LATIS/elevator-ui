<template>
  <a
    v-if="item.href"
    :href="item.href ?? '#'"
    :class="[
      item.isCurrentPage
        ? 'bg-amber-200 text-neutral-900'
        : ' text-neutral-600 hover:bg-blue-100  hover:text-neutral-900',
      'group w-full flex items-center pl-2 py-2 font-medium my-1 hover:no-underline',
    ]"
  >
    {{ item.name }}
  </a>
  <hr v-else class="my-2 bg-neutral-500" />
</template>
<script setup lang="ts">
import { NavItem } from "@/types";

defineProps<{
  item: NavItem;
}>();
</script>
<style scoped></style>
