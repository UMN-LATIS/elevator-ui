<template>
  <component
    :is="href ? 'a' : 'span'"
    :href="href"
    class="chip inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-transparent-black-100 hover:no-underline no-underline text-neutral-700"
    :class="{
      'chip--is-clickable border border-blue-700  bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-700 hover:text-white transition-colors ease-in-out':
        href,
    }"
  >
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
