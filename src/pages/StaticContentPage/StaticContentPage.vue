<template>
  <DefaultLayout>
    <h1>Page {{ pageId }}</h1>
    Static Content goes here
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";

defineProps<{
  pageId: string;
}>();
</script>
<style scoped></style>
