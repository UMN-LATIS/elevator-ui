<template>
  <div class="mb-12">
    <h2 class="text-xl font-bold mb-4 text-on-surface border-b border-outline pb-2">
      {{ title }}
    </h2>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>
