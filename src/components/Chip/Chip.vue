<template>
  <component
    :is="href ? 'a' : 'span'"
    :href="href"
    class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-transparent-black-100 hover:no-underline no-underline text-neutral-700"
    :class="{
      'border border-blue-700  bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-700 hover:text-white transition-colors ease-in-out':
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
<style scoped></style>
