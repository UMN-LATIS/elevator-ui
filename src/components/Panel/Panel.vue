<template>
  <section class="panel flex flex-col overflow-auto">
    <header
      class="panel__header flex flex-wrap items-center sticky top-0 left-0 justify-between z-10 backdrop-blur-[2px]"
      :class="{
        'h-full': !isOpen,
      }">
      <button
        :disabled="!showToggle"
        class="flex items-center p-4 leading-tight gap-4 flex-1"
        @click="$emit('toggle')">
        <span v-if="showToggle">
          <ChevronDownIcon v-if="isOpen" class="w-5 h-5" />
          <ChevronUpIcon v-if="!isOpen" class="w-5 h-5" />
        </span>
        <slot name="header-label">
          <PanelLabel :label="label" :isOpen="isOpen" />
        </slot>
      </button>

      <div class="panel__header-utils">
        <slot name="header-utils"></slot>
      </div>
    </header>

    <div
      v-show="isOpen"
      class="panel__body flex flex-col gap-6 px-4 md:p-8 flex-1">
      <slot />
    </div>
  </section>
</template>
<script setup lang="ts">
import PanelLabel from "./PanelLabel.vue";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import ChevronUpIcon from "@/icons/ChevronUpIcon.vue";

withDefaults(
  defineProps<{
    label: string;
    isOpen?: boolean;
    showToggle?: boolean;
  }>(),
  {
    isOpen: true,
    showToggle: true,
  }
);

defineEmits<{
  (eventName: "toggle");
}>();
</script>
<style scoped>
.panel__header {
  background: var(--surface-container-low) / 0.5;
  color: var(--on-surface);
}

[data-theme="dark"] .panel__header {
  background: transparent;
  color: var(--warning);
}

.panel__body {
  background: transparent;
  color: var(--on-surface);
  border-top-color: var(--surface-bright);
  gap: 1.5rem;
}

[data-theme="dark"] .panel__body {
  border-top-color: transparent;
}
</style>
