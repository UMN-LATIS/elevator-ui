<template>
  <div
    class="text-sm rounded-md"
    :class="{
      'border border-neutral-200 p-4 bg-white': isAddingExcerpt,
    }"
  >
    <label class="inline-flex gap-1 items-center">
      <input
        v-model="isAddingExcerpt"
        type="checkbox"
        aria-label="Add Excerpt"
        class="text-sm rounded-sm"
      />
      Add as Excerpt
    </label>

    <div
      v-if="isAddingExcerpt"
      class="excerpt-details flex flex-col gap-2 mt-4"
    >
      <ObjectViewer :fileHandlerId="fileObjectId" class="aspect-video mb-4" />

      <div class="flex gap-4 justify-center">
        <InputGroup
          id="excerpt__start-time"
          :modelValue="startTimeString"
          label="Start Time"
          placeholder="00:00"
          type="text"
          class="w-32"
          @update:modelValue="handleStartTimeChange"
        >
          <template #append>
            <Button variant="tertiary" class="text-sm">Set</Button>
          </template>
        </InputGroup>
        <InputGroup
          id="excerpt__end-time"
          :modelValue="endTimeString"
          label="End Time"
          placeholder="00:00"
          type="text"
          class="w-32"
          @update:modelValue="handleEndTimeChange"
        >
          <template #append>
            <Button variant="tertiary" class="text-sm">Set</Button>
          </template>
        </InputGroup>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import Button from "@/components/Button/Button.vue";
import ObjectViewer from "@/components/ObjectViewer/ObjectViewer.vue";

export interface Excerpt {
  startTime: number | null;
  endTime: number | null;
}

const props = defineProps<{
  modelValue: Excerpt;
  fileObjectId: string;
}>();

const emit = defineEmits<{
  (eventName: "update:modelValue", value: Excerpt): void;
}>();

const isAddingExcerpt = ref(false);
const startTimeString = computed(() => {
  return props.modelValue.startTime?.toString() ?? "";
});
const endTimeString = computed(() => {
  return props.modelValue.endTime?.toString() ?? "";
});

function handleEndTimeChange(value: string) {
  const endTime = Number.parseInt(value);
  emit("update:modelValue", {
    ...props.modelValue,
    endTime: Number.isNaN(endTime) ? null : endTime,
  });
}

function handleStartTimeChange(value: string) {
  const startTime = Number.parseInt(value);
  emit("update:modelValue", {
    ...props.modelValue,
    startTime: Number.isNaN(startTime) ? null : startTime,
  });
}
</script>
<style scoped></style>
