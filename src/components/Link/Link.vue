<template>
  <RouterLink v-if="to" :to="to"><slot /></RouterLink>
  <a v-else :href="href"><slot /></a>
</template>
<script setup lang="ts">
import { type RouteLocationRaw, RouterLink } from "vue-router";

withDefaults(
  defineProps<{
    to?: RouteLocationRaw;
    href?: string;
  }>(),
  {
    to: undefined,
    href: "#",
  }
);
</script>

<style scoped></style>
