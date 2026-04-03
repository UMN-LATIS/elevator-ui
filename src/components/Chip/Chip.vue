<template>
  <component
    :is="href ? 'a' : 'span'"
    :href="href"
    class="chip inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-surface-container hover:no-underline no-underline text-on-surface"
    :class="{
      'chip--is-clickable border cursor-pointer transition-colors ease-in-out':
        isInteractive,
    }">
    <slot />
    <ArrowUpRight
      v-if="isInteractive"
      class="chip__icon"
      :size="12"
      :stroke-width="2.5" />
  </component>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { ArrowUpRight } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    href?: string;
    clickable?: boolean;
  }>(),
  {
    href: undefined,
    clickable: false,
  }
);

const isInteractive = computed(() => !!props.href || props.clickable);
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
}

.chip__icon {
  flex-shrink: 0;
}
</style>
