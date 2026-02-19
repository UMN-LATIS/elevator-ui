<template>
  <Notification
    type="warning"
    title="Sign In Required"
    class="home-page__sign-in-required-notice my-4 rounded-md">
    <p>This site requires you to sign in to search or access assets.</p>

    <div class="flex gap-2 mt-2">
      <Button
        :to="`/loginManager/localLogin/?redirect=${$route.path}`"
        variant="tertiary"
        class="border border-primary py-2 px-4">
        <span v-if="instance.useCentralAuth" class="guest-auth-label">
          <!--
          The label for the guest login option can be customized via the `--guest-auth-label` CSS variable. If not set, it will default to "Guest". Eventually, this could become an explicit instance setting.
        --></span>
        Login
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
import { computed } from "vue";
import config from "@/config";
import Notification from "@/components/Notification/Notification.vue";
import Button from "@/components/Button/Button.vue";

const instanceStore = useInstanceStore();
const instance = computed(() => instanceStore.instance);
const browserLocation = useBrowserLocation();
const encodedCallbackUrl = computed(() => {
  const callbackUrl = browserLocation.value?.href ?? config.instance.base.url;
  return encodeURIComponent(callbackUrl);
});
</script>
<<<<<<< HEAD
<style scoped></style>
=======
<style scoped>
.guest-auth-label::before {
  content: var(--guest-auth-label, "Guest");
}
</style>
>>>>>>> 8771e6b (use css variable for guest login label (#432))
