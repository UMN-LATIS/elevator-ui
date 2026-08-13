<template>
  <p
    data-testid="unsaved-changes-indicator"
    :class="
      hasUnsavedChanges ? 'text-warning font-medium' : 'text-on-surface-variant'
    ">
    {{ hasUnsavedChanges ? "Unsaved changes" : "No unsaved changes" }}
  </p>
</template>

<script setup lang="ts">
// Both states render so that saving does not shift the surrounding layout.
defineProps<{
  hasUnsavedChanges: boolean;
}>();
</script>
