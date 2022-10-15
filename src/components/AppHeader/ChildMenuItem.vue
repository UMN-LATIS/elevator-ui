<template>
  <li>
    <hr v-if="isSeparator(item)" />
    <span v-else-if="isSubheading(item)" class="italic">{{ item }}</span>
    <Link v-else-if="isMenuItem(item)" :href="item.href" :to="item.to">
      {{ item.name }}
    </Link>
  </li>
</template>
<script setup lang="ts">
import { ChildMenuItem, MenuItem } from "@/types";
import Link from "../Link/Link.vue";

defineProps<{
  item: ChildMenuItem;
}>();

/** plain strings are use for subheadings */
function isSubheading(x: ChildMenuItem) {
  return typeof x === "string";
}

/** null values are used for separators */
function isSeparator(x: ChildMenuItem) {
  return x === null;
}

function isMenuItem(x: ChildMenuItem): x is MenuItem {
  return typeof x === "object" && !!x?.name;
}
</script>
<style scoped></style>
