<template>
  <component
    :is="href ? 'a' : 'span'"
    :href="href"
    class="chip inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-surface-container hover:no-underline no-underline text-on-surface-variant"
    :class="{
      'chip--is-clickable border border-m3-primary bg-m3-primary-container text-on-primary-container cursor-pointer hover:bg-m3-primary hover:text-on-primary transition-colors ease-in-out':
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
  border-color: var(--app-link-textColor);
  background: var(--app-link-textColor-inverse);
  color: var(--app-link-textColor);

  &:hover {
    color: var(--app-link-textColor-inverse);
    background: var(--app-link-textColor);
  }
}
</style>
