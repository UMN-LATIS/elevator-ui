<template>
  <div>
    <button
      class="flex justify-between items-center gap-2 border-none rounded-b-none text-link-b"
      :label="isOpen ? 'close' : 'open'"
      :icon="isOpen ? 'expand_less' : 'expand_more'"
      @click="handleAccordionToggle"
    >
      <slot name="label">
        <span class="flex-1 block text-left font-normal">{{ label }}</span>
      </slot>
      <div class="flex place-items-center">
        <slot name="label-icon">
          <span class="material-symbols-outlined">
            {{ isOpen ? "expand_less" : "expand_more" }}
          </span>
        </slot>
      </div>
    </button>
    <div v-if="isOpen" class="relative z-10">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

withDefaults(
  defineProps<{
    label?: string;
  }>(),
  {
    label: "-",
  }
);

const emit = defineEmits<{
  (eventName: "toggle");
  (eventName: "open");
}>();

const isOpen = ref(false);

function handleAccordionToggle() {
  isOpen.value = !isOpen.value;
  emit("toggle");
  if (isOpen.value) emit("open");
}
</script>
<style scoped></style>
