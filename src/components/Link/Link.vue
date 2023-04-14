<template>
  <component
    :is="to ? RouterLink : 'a'"
    :to="to"
    :href="href"
    class="cursor-pointer"
  >
    <slot />
  </component>
</template>
<script setup lang="ts">
import { type RouteLocationRaw, RouterLink } from "vue-router";

defineProps<{
  to?: RouteLocationRaw;
  href?: string;
}>();
</script>

<style scoped></style>
