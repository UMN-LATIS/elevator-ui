<template>
  <div>
    <Teleport to="body">
      <ErrorModal />
      <ToastRoot />
    </Teleport>
    <RouterView v-if="instanceStore.isReady && drawerStore.isReady" />
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { useInstanceStore } from "./stores/instanceStore";
import { useDrawerStore } from "./stores/drawerStore";
import { useTheming } from "./helpers/useTheming";
import ErrorModal from "@/components/ErrorModal/ErrorModal.vue";
import ToastRoot from "@/components/ToastRoot/ToastRoot.vue";

// load instance store before mounting app
// this prevents a race conditiion where the search store
// tries to add search field filters before the instance store
// has returned specifics about the available search fields
const instanceStore = useInstanceStore();
const drawerStore = useDrawerStore();

onMounted(() => {
  console.log("app mounted");
  instanceStore.init();
  drawerStore.init();

  useTheming();
});
</script>
<style scoped></style>
