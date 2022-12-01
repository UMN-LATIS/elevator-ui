<template>
  <section class="">
    <div v-if="!currentUser" class="flex flex-col gap-2">
      <Button
        v-if="instance.useCentralAuth"
        variant="primary"
        :href="`${config.instance.base.url}/loginManager/remoteLogin/?redirect=${encodedCallbackUrl}`"
      >
        {{ instance.centralAuthLabel }} Login
      </Button>
      <Button
        :variant="instance.useCentralAuth ? 'secondary' : 'primary'"
        :href="`${config.instance.base.url}/loginManager/localLogin/?redirect=${encodedCallbackUrl}`"
      >
        {{ instance.useCentralAuth && "Guest" }} Login
      </Button>
    </div>
    <div v-else>
      <div class="flex flex-col items-center">
        <span class="inline-flex text-sm text-neutral-400"> Logged in as </span>
        <span class="inline-flex font-semibold">
          {{ currentUser.displayName }}
        </span>
      </div>
      <div class="flex flex-col gap-2 mt-4">
        <Button
          variant="secondary"
          :href="`${config.instance.base.url}/loginManager/logout/?redirect=${encodedCallbackUrl}`"
        >
          Logout
        </Button>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import Button from "@/components/Button/Button.vue";
import { computed } from "vue";
import config from "@/config";
import { useBrowserLocation } from "@vueuse/core";
import { ElevatorInstance, User } from "@/types";

defineProps<{
  instance: ElevatorInstance;
  currentUser: User | null;
}>();

const browserLocation = useBrowserLocation();
const encodedCallbackUrl = computed(() => {
  const callbackUrl = browserLocation.value?.href ?? config.instance.base.url;
  return encodeURIComponent(callbackUrl);
});
</script>
<style scoped></style>
