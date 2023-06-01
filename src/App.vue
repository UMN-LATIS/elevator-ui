<template>
  <router-view v-if="instanceStore.isReady" />
</template>
<script setup lang="ts">
import { useInstanceStore } from "./stores/instanceStore";

// load instance store before mounting app
// this prevents a race conditiion where the search store
// tries to add search field filters before the instance store
// has returned specifics about the available search fields
const instanceStore = useInstanceStore();
</script>
<style scoped></style>
