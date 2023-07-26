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
          v-model="startTimeString"
          label="Start Time"
          placeholder="00:00"
          type="text"
          class="w-32"
          @blur="handleStartTimeChange"
        >
          <template #append>
            <Button
              variant="tertiary"
              class="text-sm"
              @click="handleSetCurrentAsStartTime"
              >Set</Button
            >
          </template>
        </InputGroup>
        <InputGroup
          id="excerpt__end-time"
          v-model="endTimeString"
          label="End Time"
          placeholder="00:00"
          type="text"
          class="w-32"
          :class="{
            'border-red-600': !isValidEndTime,
          }"
          @blur="handleEndTimeChange"
        >
          <template #append>
            <Button
              variant="tertiary"
              class="text-sm"
              @click="handleSetCurrentAsEndTime"
              >Set</Button
            >
          </template>
        </InputGroup>
      </div>
      <p v-if="!isValidEndTime" class="text-red-600 text-xs italic text-center">
        End time must be after start time.
      </p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import Button from "@/components/Button/Button.vue";
import ObjectViewer from "@/components/ObjectViewer/ObjectViewer.vue";
import config from "@/config";

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
const currentScrubberPosition = ref(0);
const endTimeString = ref("");
const startTimeString = ref("");

function isValidTimeString(timeString: string) {
  const parts = timeString.split(":");
  if (parts.length < 0 || parts.length > 3) return false;
  for (const part of parts) {
    const partAsNumber = Number.parseInt(part);

    // I mean, I guess the number of hours could be greater than 60, but I'm
    // going to assume that's not the case for now.
    if (Number.isNaN(partAsNumber) || partAsNumber < 0 || partAsNumber >= 60) {
      return false;
    }
  }
  return true;
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

// check that startTime < endTime
const isValidEndTime = computed(() => {
  const startTime = timeStringToSeconds(startTimeString.value);
  const endTime = timeStringToSeconds(endTimeString.value);

  return startTime === null || endTime === null || endTime > startTime;
});

function handleEndTimeChange() {
  const startTime = timeStringToSeconds(startTimeString.value);
  emit("update:modelValue", {
    ...props.modelValue,
    endTime: timeStringToSeconds(endTimeString.value),
  });
}

function handleStartTimeChange() {
  emit("update:modelValue", {
    ...props.modelValue,
    startTime: timeStringToSeconds(startTimeString.value),
  });
}

function handleSetCurrentAsEndTime() {
  endTimeString.value = secondsToTimeString(currentScrubberPosition.value);
  handleEndTimeChange();
}

function handleSetCurrentAsStartTime() {
  startTimeString.value = secondsToTimeString(currentScrubberPosition.value);
  handleStartTimeChange();
}

interface ScrubberUpdateMessageEvent extends MessageEvent {
  data: {
    type: "pause" | "seeked";
    currentPosition: number; // seconds from start
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

  // update current scrubber position
  currentScrubberPosition.value = event.data.currentPosition;
  console.log("scrubber position updated", currentScrubberPosition.value);
});
</script>
<style scoped></style>
