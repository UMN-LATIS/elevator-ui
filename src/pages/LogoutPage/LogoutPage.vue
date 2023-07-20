<template>
  <DefaultLayout>
    <h1>Logged out</h1>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { onMounted } from "vue";
import api from "@/api";

onMounted(() => {
  api.logout();

  // do a full reload to clear any cached state
  window.location.href = config.instance.base.path;
});
</script>
<style scoped></style>
