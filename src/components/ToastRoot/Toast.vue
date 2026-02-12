<template>
  <div
    :key="toast.id"
    class="toast-root__toast pointer-events-auto shadow-md p-4 rounded-md relative overflow-hidden transition-all duration-300 ease-in-out"
    :class="{
      'bg-error-container text-on-error-container': toast.variant === 'error',
      'bg-success-container text-on-success-container':
        toast.variant === 'success',
      'bg-inverse-surface text-inverse-on-surface':
        toast.variant === 'default' || !toast.variant,
    }"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false">
    <div
      class="timer absolute top-0 left-0 w-full h-1 transform"
      :style="{
        transform: `translateX(-${timerWidthPercent}%)`,
      }" />
    <div class="flex items-center gap-4">
      <CircleCheckIcon
        v-if="toast.variant === 'success'"
        class="text-on-success-container w-6 h-6" />
      <TriangleAlertIcon
        v-else-if="toast.variant === 'error'"
        class="text-on-error-container w-6 h-6" />
      <InfoIcon v-else class="w-6 h-6 text-inverse-on-surface" />
      <div class="flex-1">
        <button class="float-right" @click="$emit('dismiss', toast.id)">
          <span class="sr-only">Close</span>
          <XIcon />
        </button>

        <h3
          v-if="toast.title"
          class="text-sm font-semibold"
          :class="{
            'text-on-error-container': toast.variant === 'error',
            'text-on-success-container': toast.variant === 'success',
            'text-inverse-on-surface':
              toast.variant === 'default' || !toast.variant,
          }">
          {{ toast.title }}
        </h3>
        <p class="text-xs">{{ toast.message }}</p>
        <p v-if="toast.url" class="mt-1 flex justify-end">
          <Link
            :to="toast.url"
            class="uppercase text-xs py-1 px-2 bg-surface-container text-on-surface-variant hover:no-underline hover:text-on-surface hover:bg-surface-container-high rounded-md"
            @click="$emit('dismiss', toast.id)">
            {{ toast.urlText || "View" }}
          </Link>
        </p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Toast } from "@/types";
import { onMounted, ref, computed } from "vue";
import { useRafFn } from "@vueuse/core";
import { XIcon } from "@/icons";
import Link from "../Link/Link.vue";
import CircleCheckIcon from "@/icons/CircleCheckIcon.vue";
import { InfoIcon, TriangleAlertIcon } from "lucide-vue-next";

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
