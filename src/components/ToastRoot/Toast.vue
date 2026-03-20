<template>
  <div
    :key="toast.id"
    class="toast-root__toast pointer-events-auto shadow-sm p-4 rounded-md relative overflow-hidden transition-all duration-300 ease-in-out border-2"
    :class="{
      'toast--error bg-on-error-container text-error-container border-on-error-container':
        toast.variant === 'error',
      'toast--success bg-on-success-container text-success-container border-on-success-container':
        toast.variant === 'success',
      'bg-inverse-surface text-inverse-on-surface border-inverse-surface':
        toast.variant === 'default' || !toast.variant,
    }"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false">
    <div
      v-if="isFinite(duration)"
      class="timer absolute top-0 left-0 w-full h-1 transform opacity-50"
      :style="{
        transform: `translateX(-${timerWidthPercent}%)`,
      }" />
    <div
      class="flex gap-3"
      :class="toast.title ? 'items-start' : 'items-center'">
      <CircleCheckIcon
        v-if="toast.variant === 'success'"
        class="text-success-container w-6 h-6" />
      <TriangleAlertIcon
        v-else-if="toast.variant === 'error'"
        class="text-error-container w-6 h-6" />
      <InfoIcon v-else class="w-6 h-6 text-inverse-on-surface" />
      <div class="flex-1">
        <h3
          v-if="toast.title"
          class="text-sm font-semibold"
          :class="{
            'text-error-container': toast.variant === 'error',
            'text-success-container': toast.variant === 'success',
            'text-inverse-on-surface':
              toast.variant === 'default' || !toast.variant,
          }">
          {{ toast.title }}
        </h3>
        <p class="text-xs">{{ toast.message }}</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <Link
          v-if="toast.url"
          :to="toast.url"
          class="uppercase text-xs py-1 px-2 bg-surface-container text-on-surface-variant hover:no-underline hover:text-on-surface hover:bg-surface-container-high rounded-md"
          @click="$emit('dismiss', toast.id)">
          {{ toast.urlText || "View" }}
        </Link>
        <Button v-if="toast.action" variant="tertiary" @click="handleAction">
          {{ toast.action.label }}
        </Button>
        <button
          class="opacity-60 hover:opacity-100"
          @click="$emit('dismiss', toast.id)">
          <span class="sr-only">Close</span>
          <XIcon class="w-4 h-4" />
        </button>
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
import Button from "@/components/Button/Button.vue";

const props = defineProps<{
  toast: Toast;
}>();

const emit = defineEmits<{
  (eventName: "dismiss", id: string): void;
}>();

const elapsedTime = ref(0);
const isPaused = ref(false);
const duration = props.toast.duration ?? Number.POSITIVE_INFINITY;

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

function handleAction() {
  props.toast.action?.handler();
  emit("dismiss", props.toast.id);
}

onMounted(() => {
  startTimer();
});
</script>

<style scoped>
/* Remap primary tokens so action buttons harmonize with the toast variant. */
.toast--error {
  --primary: var(--error);
  --on-primary: var(--on-error);
  --primary-container: var(--error-container);
  --on-primary-container: var(--on-error-container);
}

.toast--success {
  --primary: var(--success);
  --on-primary: var(--on-success);
  --primary-container: var(--success-container);
  --on-primary-container: var(--on-success-container);
}

.timer {
  background: var(--inverse-on-surface);
}

.toast--error .timer {
  background: var(--error);
}

.toast--success .timer {
  background: var(--success);
}
</style>
