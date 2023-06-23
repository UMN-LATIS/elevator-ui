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
          <p>Sorry. {{ error.message }}</p>

          <div class="mt-1">
            <Button href="/" variant="tertiary"> Go Home </Button>
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

const errorStore = useErrorStore();
const error = computed(() => errorStore.error);
const errorTitle = computed(() =>
  error.value instanceof ApiError ? `${error.value.statusCode} Error` : `Error`
);
const instanceStore = useInstanceStore();

const isCurrentUserUnauthorized = computed(() => {
  return (
    !instanceStore.isLoggedIn &&
    error.value instanceof ApiError &&
    error.value.statusCode === 401
  );
});
</script>
<style scoped></style>
