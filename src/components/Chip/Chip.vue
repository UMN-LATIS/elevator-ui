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
  border-color: var(--primary);
  background: var(--inverse-primary);
  color: var(--primary);

  &:hover {
    color: var(--inverse-primary);
    background: var(--primary);
  }
}
</style>
