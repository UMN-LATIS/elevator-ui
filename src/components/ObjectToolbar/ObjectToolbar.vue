<template>
  <div class="object-toolbar">
    <div class="flex justify-between items-center w-full px-4 py-2">
      <div class="flex gap-1 items-center leading-none">
        <ObjectToolbarButton>info</ObjectToolbarButton>
        <ObjectToolbarButton>download</ObjectToolbarButton>
        <ObjectToolbarButton>share</ObjectToolbarButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import ObjectToolbarButton from "./ObjectToolbarButton.vue";
</script>
<style scoped></style>
