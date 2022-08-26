<template>
  <component
    :is="href ? 'a' : 'span'"
    :href="href"
    class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-transparent-black-100 no-underline hover:underline text-neutral-700"
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
