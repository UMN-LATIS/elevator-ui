<template>
  <span class="block truncate text-sm font-medium text-on-surface">
    {{ name }}
  </span>
  <span class="block truncate text-xs text-on-surface-variant">
    {{ summary }}
  </span>
  <span v-if="ownerName" class="block truncate text-xs text-on-surface-variant">
    Created by {{ ownerName }}
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string;
    summary: string;
    ownerName?: string | null;
  }>(),
  { ownerName: null }
);
</script>
