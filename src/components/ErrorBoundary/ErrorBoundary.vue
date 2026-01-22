<template>
  <slot
    v-if="hasErrored"
    name="fallback"
    :errors="errors"
    :clearErrors="clearErrors"
    :clearError="clearError"
    :hasErrored="hasErrored">
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
import { onErrorCaptured, reactive, ref } from "vue";
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

defineSlots<{
  fallback?(props: {
    errors: Error[];
    clearError: (index: number) => void;
    clearErrors: () => void;
    hasErrored: boolean;
  }): unknown;
  default(): unknown;
}>();

const emit = defineEmits<{
  (e: "error", error: Error): void;
}>();

const errors = reactive<Error[]>([]);
const hasErrored = ref(false);

onErrorCaptured((err, instance, info) => {
  console.error(
    `Error captured in ErrorBoundary (${instance?.$options.name} ${info})\n`,
    err
  );

  // track whether we've already errored to avoid infinite loops
  // if errors are cleared
  hasErrored.value = true;
  errors.push(err);
  emit("error", err);

  return false;
});

function clearErrors() {
  errors.splice(0, errors.length);
}

// Note: we intentionally do not reset `hasErrored` here, even if this
// clears the last error. Once an error has occurred, the boundary stays
// in its fallback state to avoid re-entering the default slot and risk
// infinite error loops.
function clearError(index: number) {
  errors.splice(index, 1);
}

defineExpose({ errors, clearErrors });
</script>
