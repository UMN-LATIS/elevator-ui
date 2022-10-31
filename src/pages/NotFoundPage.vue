<template>
  <DefaultLayout>
    <h1>Not Found</h1>
    <pre>
      {{ route }}
    </pre>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
defineProps<{
  route: unknown;
}>();
</script>
<style scoped></style>
