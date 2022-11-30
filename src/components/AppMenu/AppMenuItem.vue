<template>
  <li class="app-menu-item my-2">
    <Link :to="to" :href="href" class="app-menu-item__link">
      <slot />
    </Link>
  </li>
</template>
<script setup lang="ts">
import Link from "@/components/Link/Link.vue";

defineProps<{
  to?: string;
  href?: string;
}>();
</script>
<style scoped>
.app-menu-item__link {
  color: var(--app-menu-textColor);
}
</style>
