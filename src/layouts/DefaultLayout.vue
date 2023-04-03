<template>
  <div class="min-h-screen pt-18">
    <AppHeader class="top-0 w-full z-20 sticky left-0" />
    <WarningPanel
      v-if="isReady && !currentUser?.canSearchAndBrowse"
      title="Sign In Required"
    >
      <p>This site requires you to sign in to search or access assets.</p>

      <div class="flex gap-2 my-2">
        <WarningPanelButton
          :href="`${config.instance.base.url}/loginManager/localLogin/?redirect=${encodedCallbackUrl}`"
          :isPrimary="!instance.useCentralAuth"
        >
          {{ instance.useCentralAuth ? "Guest" : "" }} Login
        </WarningPanelButton>
        <WarningPanelButton
          v-if="instance.useCentralAuth"
          :href="`${config.instance.base.url}/loginManager/remoteLogin/?redirect=${encodedCallbackUrl}`"
          isPrimary
        >
          {{ instance.centralAuthLabel }} Login
        </WarningPanelButton>
      </div>
    </WarningPanel>

    <slot />
  </div>
</template>
<script setup lang="ts">
import AppHeader from "@/components/AppHeader/AppHeader.vue";
import { useBrowserLocation } from "@vueuse/core";
import { useInstanceStore } from "@/stores/instanceStore";
import { computed } from "vue";
import config from "@/config";
import WarningPanel from "@/components/WarningPanel/WarningPanel.vue";
import WarningPanelButton from "@/components/WarningPanel/WarningPanelButton.vue";

const instanceStore = useInstanceStore();
const currentUser = computed(() => instanceStore.currentUser);
const instance = computed(() => instanceStore.instance);
const isReady = computed(() => instanceStore.fetchStatus === "success");
const browserLocation = useBrowserLocation();
const encodedCallbackUrl = computed(() => {
  const callbackUrl = browserLocation.value?.href ?? config.instance.base.url;
  return encodeURIComponent(callbackUrl);
});
</script>
<style></style>
