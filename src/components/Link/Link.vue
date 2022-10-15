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
import { RouterLink } from "vue-router";

defineProps<{
  /**
   * makes a RouterLink
   */
  to?: string;
  href?: string;
}>();
</script>
<style scoped></style>
