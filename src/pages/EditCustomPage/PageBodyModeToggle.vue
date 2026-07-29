<template>
  <div
    class="inline-flex rounded-md border border-outline-variant overflow-hidden text-xs"
    role="group"
    aria-label="Editor mode"
    data-testid="page-body-mode-toggle">
    <button
      type="button"
      :class="buttonClass(mode === 'rich')"
      :aria-pressed="mode === 'rich'"
      data-testid="page-body-mode-rich"
      @click="emit('update:mode', 'rich')">
      Visual
    </button>
    <button
      type="button"
      :class="buttonClass(mode === 'source')"
      :aria-pressed="mode === 'source'"
      data-testid="page-body-mode-source"
      @click="emit('update:mode', 'source')">
      HTML
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  mode: "source" | "rich";
}>();

const emit = defineEmits<{
  (event: "update:mode", mode: "source" | "rich"): void;
}>();

function buttonClass(isActive: boolean): string {
  const base = "px-2 py-1 transition-colors";
  return isActive
    ? `${base} bg-secondary-container text-on-secondary-container font-medium`
    : `${base} bg-surface-container text-on-surface-variant hover:bg-surface-container-high`;
}
</script>
