<template>
  <div>
    <div
      v-if="config.isUsingMockServer"
      :class="{
        'border-[0.5rem] border-pink-500 pointer-events-none fixed inset-0 z-[9999]':
          config.isUsingMockServer,
      }">
      <p class="text-center text-pink-500 font-bold uppercase text-xs">
        using mock backend
      </p>
    </div>
    <Teleport to="body">
      <ErrorModal />
      <ToastRoot class="z-[60]" />
      <ThemePreviewBar />
    </Teleport>
    <ErrorBoundary>
      <RouterView v-if="isInstanceNavReady && drawerStore.isReady" />
    </ErrorBoundary>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useDrawerStore } from "./stores/drawerStore";
import { useTheming } from "./helpers/useTheming";
import { useElevatorSessionStorage } from "./helpers/useElevatorSessionStorage";
import ErrorModal from "@/components/ErrorModal/ErrorModal.vue";
import ToastRoot from "@/components/ToastRoot/ToastRoot.vue";
import ThemePreviewBar from "@/components/ThemePreviewBar/ThemePreviewBar.vue";
import config from "@/config";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary.vue";
import { useCustomCSS } from "./composables/useCustomCSS";
import { useCustomScripts } from "./composables/useCustomScripts";
import { useInstanceNavQuery } from "@/queries/useInstanceNavQuery";

const drawerStore = useDrawerStore();
const elevatorSessionStorage = useElevatorSessionStorage();

// Pages assume instanceNav data (nav pages, collections, searchable
// fields) is already in the query cache, so hold the RouterView until
// the first fetch succeeds.
const { data: instanceNav } = useInstanceNavQuery();
const isInstanceNavReady = computed(() => instanceNav.value !== undefined);

onMounted(() => {
  console.log("app mounted");
  drawerStore.init();

  if (window.name === "elevatorPlugin") {
    window.addEventListener("message", elevatorSessionStorage.init);
    window.opener.postMessage("parentLoaded", "*");
  }

  useTheming();
  useCustomCSS();
  useCustomScripts();
});

onUnmounted(() => {
  console.log("app unmounted");
  if (window.name === "elevatorPlugin") {
    window.removeEventListener("message", elevatorSessionStorage.init);
  }
});
</script>
<style scoped></style>
