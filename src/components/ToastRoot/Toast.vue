<template>
  <div
    :key="toast.id"
    class="toast-root__toast pointer-events-auto shadow-md p-4 rounded-md relative overflow-hidden border transition-all duration-300 ease-in-out"
    :class="{
      'bg-red-50 text-red-700 border-red-200': toast.variant === 'error',
      'bg-green-50 text-green-700 border-green-200':
        toast.variant === 'success',
      ' border-neutral-900 bg-neutral-900 text-neutral-200':
        toast.variant === 'default' || !toast.variant,
    }"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false">
    <button class="float-right" @click="$emit('dismiss', toast.id)">
      <span class="sr-only">Close</span>
      <XIcon />
    </button>
    <div
      class="timer absolute top-0 left-0 w-full h-1 transform"
      :class="{
        'bg-red-300': toast.variant === 'error',
        'bg-neutral-600': toast.variant === 'default' || !toast.variant,
      }"
      :style="{
        transform: `translateX(-${timerWidthPercent}%)`,
      }" />
    <h3
      v-if="toast.title"
      class="text-sm font-semibold"
      :class="{
        'text-red-700': toast.variant === 'error',
        'text-green-700': toast.variant === 'success',
        'text-neutral-200': toast.variant === 'default' || !toast.variant,
      }">
      {{ toast.title }}
    </h3>
    <p class="text-xs">{{ toast.message }}</p>
    <p v-if="toast.url" class="mt-1 flex justify-end">
      <Link
        :to="toast.url"
        class="uppercase text-xs py-1 px-2 bg-transparent-white-200 text-neutral-400 hover:no-underline hover:text-neutral-900 hover:bg-neutral-200 rounded-md"
        @click="$emit('dismiss', toast.id)">
        {{ toast.urlText || "View" }}
      </Link>
    </p>
  </div>
</template>
<script setup lang="ts">
import { Toast } from "@/types";
import { onMounted, ref, computed } from "vue";
import { useRafFn } from "@vueuse/core";
import { XIcon } from "@/icons";
import Link from "../Link/Link.vue";

const props = defineProps<{
  toast: Toast;
}>();

const emit = defineEmits<{
  (eventName: "dismiss", id: string): void;
}>();

const elapsedTime = ref(0);
const isPaused = ref(false);
const duration = props.toast.duration ?? 3000;

const timerWidthPercent = computed(() => (elapsedTime.value / duration) * 100);

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
    if (elapsedTime.value >= duration) {
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
