<template>
  <div class="">Drawer View Page {{ drawerId }}</div>
</template>
<script setup lang="ts">
defineProps<{
  drawerId: string;
}>();
</script>
<style scoped></style>
