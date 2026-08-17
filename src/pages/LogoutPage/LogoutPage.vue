<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDrawerStore } from "@/stores/drawerStore";
import { useLogoutMutation } from "@/queries/useLogoutMutation";

const drawerStore = useDrawerStore();
const router = useRouter();
const { mutateAsync: logout } = useLogoutMutation();

onMounted(async () => {
  try {
    await logout();
  } catch {
    // send the user home even if the request failed
  }

  // the logout mutation clears any cached data
  // so re-init drawerStore
  drawerStore.init();
  router.push("/");
});
</script>

<template>
  <div role="status" aria-live="polite" class="p-8 text-center">
    Logging out…
  </div>
</template>
