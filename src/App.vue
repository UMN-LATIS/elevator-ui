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
      <ToastRoot />
    </Teleport>
    <RouterView v-if="instanceStore.isReady && drawerStore.isReady" />
  </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useInstanceStore } from "./stores/instanceStore";
import { useDrawerStore } from "./stores/drawerStore";
import { useTheming } from "./helpers/useTheming";
import { useElevatorSessionStorage } from "./helpers/useElevatorSessionStorage";
import ErrorModal from "@/components/ErrorModal/ErrorModal.vue";
import ToastRoot from "@/components/ToastRoot/ToastRoot.vue";
import config from "@/config";

// load instance store before mounting app
// this prevents a race conditiion where the search store
// tries to add search field filters before the instance store
// has returned specifics about the available search fields
const instanceStore = useInstanceStore();
const drawerStore = useDrawerStore();
const elevatorSessionStorage = useElevatorSessionStorage();

onMounted(() => {
  console.log("app mounted");
  instanceStore.init();
  drawerStore.init();

  if (window.name === "elevatorPlugin") {
    window.addEventListener("message", elevatorSessionStorage.init);
    window.opener.postMessage("parentLoaded", "*");
  }

  useTheming();
});

onUnmounted(() => {
  console.log("app unmounted");
  if (window.name === "elevatorPlugin") {
    window.removeEventListener("message", elevatorSessionStorage.init);
  }
});
</script>
<style scoped></style>
