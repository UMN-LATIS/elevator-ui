<template>
  <Notification type="warning" title="Sign In Required" class="my-4">
    <p>This site requires you to sign in to search or access assets.</p>

    <div class="flex gap-2 my-2">
      <Button
        :to="`/loginManager/localLogin/?redirect=${$route.path}`"
        variant="tertiary"
      >
        {{ instance.useCentralAuth ? "Guest" : "" }} Login
      </Button>
      <Button
        v-if="instance.useCentralAuth"
        :href="`${config.instance.base.url}/loginManager/remoteLogin/?redirect=${encodedCallbackUrl}`"
        variant="tertiary"
      >
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
<style scoped></style>
