<template>
  <div
    class="text-sm rounded-md"
    :class="{
      'border border-neutral-200 p-4 bg-white': isAddingExcerpt,
    }"
  >
    <label class="inline-flex gap-1 items-center">
      <input
        :checked="isAddingExcerpt"
        type="checkbox"
        aria-label="Add Excerpt"
        class="text-sm rounded-sm"
        @change="
          $emit(
            'update:isAddingExcerpt',
            ($event.target as HTMLInputElement).checked
          )
        "
      />
      Add as Excerpt
    </label>

    <div
      v-if="isAddingExcerpt"
      class="excerpt-details flex flex-col gap-2 mt-4"
    >
      <ExcerptableIframe
        :fileObjectId="fileObjectId"
        class="aspect-video mb-4"
        @update:currentScrubberPosition="
          (val) => (currentScrubberPosition = val)
        "
      />

      <div class="flex flex-col gap-4">
        <InputGroup
          id="excerpt-name"
          :modelValue="excerptName"
          label="Excerpt Name"
          placeholder="Excerpt Name"
          class="flex-1"
          required
          @update:modelValue="$emit('update:excerptName', $event)"
        />
        <div class="flex gap-4">
          <InputGroup
            id="excerpt__start-time"
            v-model="startTimeString"
            label="Start Time"
            placeholder="00:00"
            type="text"
            class="flex-1"
            @update:modelValue="
              (str) => $emit('update:startTime', timeStringToSeconds(str) ?? 0)
            "
            @blur="startTimeString = secondsToTimeString(startTime ?? 0)"
          >
            <template #append>
              <Button
                variant="tertiary"
                class="text-sm"
                @click="handleSetStartTimeClick"
              >
                Set</Button
              >
            </template>
          </InputGroup>
          <InputGroup
            id="excerpt__end-time"
            v-model="endTimeString"
            label="End Time"
            placeholder="00:00"
            type="text"
            class="flex-1"
            @update:modelValue="
              (str) => $emit('update:endTime', timeStringToSeconds(str) ?? 0)
            "
            @blur="endTimeString = secondsToTimeString(endTime ?? 0)"
          >
            <template #append>
              <Button
                variant="tertiary"
                class="text-sm"
                @click="handleSetEndTimeClick"
              >
                Set
              </Button>
            </template>
          </InputGroup>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import Button from "@/components/Button/Button.vue";
import {
  secondsToTimeString,
  timeStringToSeconds,
} from "@/helpers/excerptHelpers";
import ExcerptableIframe from "../ExcerptableIframe/ExcerptableIframe.vue";

const props = defineProps<{
  isAddingExcerpt: boolean;
  startTime: number | null;
  endTime: number | null;
  excerptName: string;
  fileObjectId: string;
}>();

const emit = defineEmits<{
  (eventName: "update:startTime", value: number | null): void;
  (eventName: "update:endTime", value: number | null): void;
  (eventName: "update:excerptName", value: string): void;
  (eventName: "update:isAddingExcerpt", value: boolean): void;
}>();

const startTimeString = ref("");
const endTimeString = ref("");
const currentScrubberPosition = ref(0);

function handleSetStartTimeClick() {
  startTimeString.value = secondsToTimeString(currentScrubberPosition.value);
  emit("update:startTime", currentScrubberPosition.value);
}

function handleSetEndTimeClick() {
  endTimeString.value = secondsToTimeString(currentScrubberPosition.value);
  emit("update:endTime", currentScrubberPosition.value);
}
</script>
<style scoped></style>
