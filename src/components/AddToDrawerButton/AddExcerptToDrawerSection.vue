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
            @blur="handleUpdateStartTime"
          >
            <template #append>
              <Button
                variant="tertiary"
                class="text-sm"
                @click="$emit('update:startTime', currentScrubberPosition)"
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
            @blur="handleUpdateEndTime"
          >
            <template #append>
              <Button
                variant="tertiary"
                class="text-sm"
                @click="$emit('update:endTime', currentScrubberPosition)"
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
import { ref, watch } from "vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import Button from "@/components/Button/Button.vue";
import config from "@/config";
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
const duration = ref(0);

interface ScrubberUpdateMessageEvent extends MessageEvent {
  data: {
    type: "pause" | "seeked";
    currentPosition: number; // seconds from start,
    duration: number; // seconds
  };
}

const allowedMessageEventOriginPatterns = [
  config.instance.base.origin,
  window.location.origin,
];
const allowedMessageEventOriginsRegex = new RegExp(
  `^(${allowedMessageEventOriginPatterns.join("|")})$`
);

window.addEventListener("message", (event: ScrubberUpdateMessageEvent) => {
  // If invalid origin, discard the message
  if (!allowedMessageEventOriginsRegex.test(event.origin)) {
    throw new Error(
      `Cannot update current scruber position. The MessageEvent is from invalid origin: ${event.origin}`
    );
  }

  if (!["ready", "seeked", "pause"].includes(event.data.type)) {
    return;
  }

  // update current scrubber position
  currentScrubberPosition.value = event.data.currentPosition;
  duration.value = event.data.duration;
});

function handleUpdateStartTime() {
  const newStartTime = timeStringToSeconds(startTimeString.value) ?? 0;

  emit("update:startTime", newStartTime);
  // update the start time string too, in case the previous value was invalid
  startTimeString.value = secondsToTimeString(newStartTime);
}

function handleUpdateEndTime() {
  const newEndTime = timeStringToSeconds(endTimeString.value);

  emit("update:endTime", newEndTime);
  // update the end time string too, in case the previous value was invalid
  endTimeString.value = secondsToTimeString(newEndTime);
}

watch(
  () => props.startTime,
  () => {
    startTimeString.value = secondsToTimeString(props.startTime);
  },
  { immediate: true }
);

watch(
  () => props.endTime,
  () => {
    endTimeString.value = secondsToTimeString(props.endTime);
  },
  { immediate: true }
);
</script>
<style scoped></style>
