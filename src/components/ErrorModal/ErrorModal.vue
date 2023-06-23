<template>
  <div>
    <Transition name="fade">
      <div
        v-if="error"
        class="fixed inset-0 z-40 bg-transparent-black-700 flex items-center justify-center"
      >
        <SignInRequiredNotice v-if="isCurrentUserUnauthorized" />

        <Notification
          v-else
          :title="errorTitle"
          :message="error.name"
          type="error"
          :isDismissable="true"
          class="w-full max-w-md border-none max-h-[80vh] !overflow-auto"
          @dismiss="errorStore.clearError()"
        >
          <p>Sorry. {{ message }}</p>

          <div class="mt-1">
            <!-- using href for force app reload -->
            <Button :href="BASE_URL" variant="tertiary"> Go Home </Button>
          </div>
        </Notification>
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import Button from "../Button/Button.vue";
import { useErrorStore } from "@/stores/errorStore";
import Notification from "../Notification/Notification.vue";
import { ApiError } from "@/api/ApiError";
import { useInstanceStore } from "@/stores/instanceStore";
import SignInRequiredNotice from "@/pages/HomePage/SignInRequiredNotice.vue";
import config from "@/config";

const BASE_URL = config.instance.base.url;
const errorStore = useErrorStore();
const instanceStore = useInstanceStore();

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
const isCurrentUserUnauthorized = computed(() => {
  return (
    !instanceStore.isLoggedIn &&
    error.value instanceof ApiError &&
    error.value.statusCode === 401
  );
});

const messages: Record<number | string, string> = {
  0: "There was a problem connecting to the server. If the problem persists, please contact support.",
  401: "You do not have permission to access this resource.",
  403: "You do not have permission to access this resource.",
  404: "The resource you are looking for could not be found.",

  // 4xx errors
  400: "There was a problem with your request. Please check your input and try again.",

  // 5xx errors
  500: "There was a problem on our end. Please contact support if the problem persists.",
};

const message = computed(() => {
  if (!(error.value instanceof ApiError)) {
    return error.value?.message || "An unknown error occurred.";
  }

  const status = error.value.statusCode;
  if (status in messages) {
    return messages[status];
  }

  if (status >= 400 && status < 500) {
    return messages[400];
  }

  if (status >= 500 && status < 600) {
    return messages[500];
  }

  return error.value.message;
});
</script>
<style scoped></style>
