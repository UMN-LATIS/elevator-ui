<template>
  <component
    :is="href ? 'a' : 'span'"
    :href="href"
    class="chip inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-surface-container hover:no-underline no-underline text-on-surface-variant"
    :class="{
      'chip--is-clickable border border-primary bg-primary-container text-on-primary-container cursor-pointer hover:bg-primary hover:text-on-primary transition-colors ease-in-out':
        href,
    }">
    <slot />
  </component>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    href?: string;
  }>(),
  {
    href: undefined,
  }
);
</script>
<style scoped lang="postcss">
.chip--is-clickable {
  border-color: oklch(var(--primary));
  background: oklch(var(--inverse-primary));
  color: oklch(var(--primary));

  &:hover {
    color: oklch(var(--inverse-primary));
    background: oklch(var(--primary));
  }
}

[data-theme="dark"] .chip--is-clickable {
  border-color: oklch(var(--warning));
  color: oklch(var(--warning));

  &:hover {
    background: oklch(var(--warning));
    color: oklch(var(--on-warning));
  }
}
</style>
