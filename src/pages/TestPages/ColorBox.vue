<template>
  <div :class="['rounded-lg p-4 border border-outline', props.class]">
    <div class="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-2">
      {{ label }}
    </div>
    <div class="aspect-square flex items-center justify-center rounded bg-surface-container" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  class: string;
}>();
</script>
