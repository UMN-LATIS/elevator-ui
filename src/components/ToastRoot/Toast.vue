<template>
  <div
    :key="toast.id"
    class="pointer-events-auto shadow-md bg-neutral-900 text-neutral-200 p-4 rounded-md relative overflow-hidden"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
  >
    <button class="float-right" @click="$emit('dismiss', toast.id)">
      <span class="sr-only">Close</span>
      <XIcon />
    </button>
    <div
      class="timer absolute top-0 left-0 w-full h-2 bg-neutral-600 transform"
      :style="{
        transform: `translateX(-${timerWidthPercent}%)`,
      }"
    />
    {{ toast.message }}
  </div>
</template>
<script setup lang="ts">
import { Toast } from "@/types";
import { onMounted, ref, computed } from "vue";
import { useRafFn } from "@vueuse/core";
import { XIcon } from "@/icons";

const props = withDefaults(
  defineProps<{
    toast: Toast;
    duration?: number;
  }>(),
  {
    duration: 5000,
  }
);

const emit = defineEmits<{
  (eventName: "dismiss", id: string): void;
}>();

const elapsedTime = ref(0);
const isPaused = ref(false);

const timerWidthPercent = computed(
  () => (elapsedTime.value / props.duration) * 100
);

function startTimer() {
  isPaused.value = false;
  let prevTimestamp = Date.now();

  useRafFn(() => {
    const delta = Date.now() - prevTimestamp;

    // if we're paused, then don't update the elapsed time
    if (!isPaused.value) {
      elapsedTime.value += delta;
    }

    // if we've reached the duration, close the toast
    if (elapsedTime.value >= props.duration) {
      emit("dismiss", props.toast.id);
    }

    // update the timestamp
    prevTimestamp = Date.now();
  });
}

onMounted(() => {
  startTimer();
});
</script>
<style scoped></style>
