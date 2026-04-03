<template>
  <span
    class="chip inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-surface-container text-on-surface"
    :class="{
      'chip--is-clickable border cursor-pointer transition-colors ease-in-out':
        clickable,
    }">
    <slot />
    <ArrowUpRight
      v-if="clickable"
      class="chip__icon"
      :size="12"
      :stroke-width="2.5" />
  </span>
</template>
<script setup lang="ts">
import { ArrowUpRight } from "lucide-vue-next";

withDefaults(
  defineProps<{
    clickable?: boolean;
  }>(),
  {
    clickable: false,
  }
);
</script>
<style scoped lang="postcss">
.chip--is-clickable {
  border-color: var(--primary);
  background: var(--primary-container);
  color: var(--on-primary-container);

  &:hover {
    color: var(--on-primary);
    background: var(--primary);
  }

  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
}

.chip__icon {
  flex-shrink: 0;
}
</style>
