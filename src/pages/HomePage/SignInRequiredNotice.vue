<template>
  <Notification
    type="warning"
    title="Sign In Required"
    class="ome-page__sign-in-required-notice my-4">
    <p>This site requires you to sign in to search or access assets.</p>

    <div class="flex gap-2 mt-2">
      <Button
        :to="`/loginManager/localLogin/?redirect=${redirectPath}`"
        variant="tertiary">
        {{ instance.useCentralAuth ? "Guest" : "" }} Login
      </Button>
      <Button
        v-if="instance.useCentralAuth"
        :href="`${config.instance.base.url}/loginManager/remoteLogin/?redirect=${encodedCallbackUrl}`"
        variant="tertiary">
        {{ instance.centralAuthLabel }} Login
      </Button>
    </div>
  </Notification>
</template>
<script setup lang="ts">
import { useBrowserLocation } from "@vueuse/core";
import { useInstanceStore } from "@/stores/instanceStore";
import { useRoute } from "vue-router";
import { computed } from "vue";
import config from "@/config";
import Notification from "@/components/Notification/Notification.vue";
import Button from "@/components/Button/Button.vue";
import { ApiError } from "@/api/ApiError";

const props = withDefaults(
  defineProps<{
    error?: ApiError | Error | null;
  }>(),
  {
    error: null,
  }
);

const route = useRoute();
const instanceStore = useInstanceStore();
const instance = computed(() => instanceStore.instance);
const browserLocation = useBrowserLocation();

// Use redirect URL from error data if available, otherwise fall back to current route
const redirectPath = computed(() => {
  if (props.error instanceof ApiError && props.error.data) {
    const errorData = props.error.data as { redirectUrl?: string };
    if (errorData.redirectUrl) {
      return errorData.redirectUrl;
    }
  }
  return route.path;
});

const encodedCallbackUrl = computed(() => {
  const callbackUrl = browserLocation.value?.href ?? config.instance.base.url;
  return encodeURIComponent(callbackUrl);
});
</script>
<style scoped></style>
