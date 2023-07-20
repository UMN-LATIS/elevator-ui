<template>
  <DefaultLayout>
    <h1 class="my-8 text-center text-3xl animate-pulse">Logging out...</h1>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { onMounted } from "vue";
import api from "@/api";
import config from "@/config";

onMounted(() => {
  api.logout();

  // do a full reload to clear any cached state
  window.location.href = config.instance.base.path;
});
</script>
<style scoped></style>
