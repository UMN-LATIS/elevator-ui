<template>
  <slot
    v-if="errors.length"
    name="fallback"
    :errors="errors"
    :clearErrors="clearErrors">
    <Notification
      v-for="(error, index) in errors"
      :key="index"
      type="danger"
      :title="title"
      :isDismissable="true"
      class="my-2 shadow"
      @dismiss="clearError(index)">
      <p>{{ error.message }}</p>
    </Notification>
  </slot>
  <slot v-else name="default" />
</template>

<script setup lang="ts">
import { onErrorCaptured, reactive } from "vue";
import { useToastStore } from "@/stores/toastStore";
import Notification from "@/components/Notification/Notification.vue";

withDefaults(
  defineProps<{
    title?: string;
    message?: string;
    isDismissable?: boolean;
  }>(),
  {
    title: "An unexpected error occurred",
    message: "",
    isDismissable: true,
  }
);

defineOptions({
  name: "ErrorBoundary",
  inheritAttrs: false,
});

const emit = defineEmits<{
  (e: "error", error: Error): void;
}>();

const errors = reactive<Error[]>([]);
const toastStore = useToastStore();

onErrorCaptured((err, instance, info) => {
  console.error(
    `Error captured in ErrorBoundary (${instance?.$options.name} ${info})\n`,
    err
  );
  errors.push(err);
  emit("error", err);

  toastStore.addToast({
    variant: "error",
    message: `An unexpected error occurred: ${err.message}`,
    duration: 10_000,
  });
  return false;
});

function clearErrors() {
  errors.splice(0, errors.length);
}

function clearError(index: number) {
  errors.splice(index, 1);
}

defineExpose({ errors, clearErrors });
</script>
