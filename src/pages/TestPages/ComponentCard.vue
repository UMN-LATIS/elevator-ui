<template>
  <div class="border border-outline rounded-lg p-4 bg-surface-container-low">
    <div class="text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-3">
      {{ label }}
    </div>
    <div class="flex items-center justify-center min-h-[60px]">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>
