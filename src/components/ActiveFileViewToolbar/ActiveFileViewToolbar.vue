<template>
  <div class="object-toolbar">
    <div class="flex justify-between items-center w-full px-4 py-2">
      <div class="flex gap-1 items-center leading-none">
        <ActiveFileViewButton>info</ActiveFileViewButton>
        <ActiveFileViewButton>download</ActiveFileViewButton>
        <ActiveFileViewButton>share</ActiveFileViewButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import ActiveFileViewButton from "./ActiveFileViewButton.vue";
</script>
<style scoped></style>
