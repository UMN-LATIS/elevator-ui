<template>
  <h1 class="header-label font-bold relative text-left" :title="label">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <span class="min-w-0 block" v-html="label"></span>
  </h1>
</template>
<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>
<style scoped></style>
