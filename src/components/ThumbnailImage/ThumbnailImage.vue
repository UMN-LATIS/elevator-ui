<template>
  <component
    :is="href ? 'a' : 'div'"
    class="block rounded overflow-hidden hover:shadow-md"
    :href="href"
  >
    <img :src="src" class="w-full h-full object-cover" :alt="alt" />
    <slot />
  </component>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    src: string;
    alt: string;
    href?: string;
  }>(),
  {
    href: undefined,
  }
);
</script>
<style scoped></style>
