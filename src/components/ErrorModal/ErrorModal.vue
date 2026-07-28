<template>
  <div class="error-modal">
    <Transition name="fade">
      <div
        v-if="error"
        class="fixed inset-0 z-40 bg-scrim flex items-center justify-center">
        <Notification
          :title="errorTitle"
          :message="error.name"
          type="danger"
          :isDismissable="true"
          class="w-full max-w-md border-none max-h-[80vh] !overflow-auto rounded-md"
          @dismiss="errorStore.clearError()">
          <p>{{ message }}</p>
        </Notification>
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useErrorStore } from "@/stores/errorStore";
import Notification from "../Notification/Notification.vue";
import { ApiError } from "@/api/ApiError";
import { getErrorMessage } from "@/api/getErrorMessage";

const errorStore = useErrorStore();

const error = computed(() => errorStore.error);
const errorTitle = computed(() => {
  if (!(error.value instanceof ApiError)) {
    return "Error";
  }

  if (error.value.statusCode === 0) {
    return "Connection Error";
  }

  return `Error: ${error.value.statusCode}`;
});

const message = computed(() => getErrorMessage(error.value));
</script>
<style scoped></style>
