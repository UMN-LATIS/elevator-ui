<script setup lang="ts">
import { onMounted } from "vue";
import api from "@/api";
import { useRouter } from "vue-router";
import { resetAllStores } from "@/stores/resetAllStores";
import { useDrawerStore } from "@/stores/drawerStore";
import { useLogoutMutation } from "@/queries/useLogoutMutation";

const drawerStore = useDrawerStore();
const router = useRouter();
const { mutateAsync: logout } = useLogoutMutation();

onMounted(async () => {
  try {
    await logout();
  } catch {
    // logout clears the session server-side before issuing a
    // cross-origin 303 the dev proxy can't follow, so a network
    // error here still means we're logged out
  }

  // do a full reload to clear any cached state
  api.clearCache();
  resetAllStores();
  drawerStore.init();
  router.push("/");
});
</script>

<template>
  <div role="status" aria-live="polite" class="p-8 text-center">
    Logging out…
  </div>
</template>
