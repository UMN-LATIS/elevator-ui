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

      <div class="flex flex-col gap-4">
        <InputGroup
          id="excerpt-name"
          v-model="excerptName"
          label="Excerpt Name"
          placeholder="Excerpt Name"
          class="flex-1"
          required
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
import ObjectViewer from "@/components/ObjectViewer/ObjectViewer.vue";
import config from "@/config";

const props = defineProps<{
  startTime: number | null;
  endTime: number | null;
  fileObjectId: string;
}>();

const emit = defineEmits<{
  (eventName: "update:startTime", value: number | null): void;
  (eventName: "update:endTime", value: number | null): void;
}>();

const isAddingExcerpt = ref(false);
const excerptName = ref("");
const startTimeString = ref("");
const endTimeString = ref("");
const currentScrubberPosition = ref(0);
const duration = ref(0);

function isValidTimeString(timeString: string) {
  const validTimeStringRegex = /^(\d{1,2}:)?([0-5]?\d:)?[0-5]?\d$/;
  return validTimeStringRegex.test(timeString);
}

function secondsToTimeString(seconds: number | null) {
  if (seconds === null) return "";

  if (Number.isNaN(seconds)) {
    throw new Error("Cannot convert seconds to time string: seconds is NaN");
  }

  if (seconds >= 60 * 60 * 24) {
    throw new Error(
      "Cannot convert seconds to time string: seconds larger than 1 day"
    );
  }

  if (seconds < 60 * 60) {
    // MM:SS
    return new Date(seconds * 1000).toISOString().slice(14, 19);
  }

  // HH:MM:SS
  return new Date(seconds * 1000).toISOString().slice(11, 19);
}

function timeStringToSeconds(timeString: string): number | null {
  if (!isValidTimeString(timeString)) {
    return null;
  }

  // 12:34:56 => [56, 34, 12]
  const parts = timeString.split(":").reverse();

  let seconds = 0;
  parts.forEach((part, index) => {
    // 12:34:56 => 56 * 60^0 + 34 * 60^1 + 12 * 60^2
    seconds += Number.parseInt(part) * Math.pow(60, index);
  });
  return seconds;
}

interface ScrubberUpdateMessageEvent extends MessageEvent {
  data: {
    type: "pause" | "seeked";
    currentPosition: number; // seconds from start,
    duration: number; // seconds
  };
}

const allowedMessageEventOriginPatterns = [
  // "https?:\/\/localhost:\\d+",
  // "https?:\/\/.*\.elevator\.umn.\.edu",
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
