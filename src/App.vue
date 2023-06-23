<template>
  <div>
    <Teleport to="body">
      <ErrorModal />
    </Teleport>
    <RouterView v-if="instanceStore.isReady" />
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { useInstanceStore } from "./stores/instanceStore";
import { useTheming } from "./helpers/useTheming";
import ErrorModal from "@/components/ErrorModal/ErrorModal.vue";

// load instance store before mounting app
// this prevents a race conditiion where the search store
// tries to add search field filters before the instance store
// has returned specifics about the available search fields
const instanceStore = useInstanceStore();

onMounted(() => {
  console.log("app mounted");
  instanceStore.init();
  useTheming();
});
</script>
<style scoped></style>
