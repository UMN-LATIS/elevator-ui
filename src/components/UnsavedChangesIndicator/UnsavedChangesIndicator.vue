<template>
  <!-- Both states render so that saving does not shift the surrounding layout. -->
  <p
    role="status"
    data-testid="unsaved-changes-indicator"
    :class="
      hasUnsavedChanges ? 'text-warning font-medium' : 'text-on-surface-variant'
    ">
    {{ hasUnsavedChanges ? "Unsaved changes" : "No unsaved changes" }}
  </p>
</template>

<script setup lang="ts">
defineProps<{
  hasUnsavedChanges: boolean;
}>();
</script>
