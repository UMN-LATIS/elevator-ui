<template>
  <div class="app">
    <router-view></router-view>
  </div>
</template>
<script setup lang="ts">
import { useInstanceStore } from "@/stores/instanceStore";

const instanceStore = useInstanceStore();
instanceStore.init();
</script>
<style scoped></style>
