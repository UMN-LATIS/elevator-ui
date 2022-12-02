<template>
  <div class="h-screen flex flex-col">
    <AppHeader class="fixed top-0 w-full z-20 backdrop-blur-sm md:static" />
    <div class="flex-1 mt-20 md:mt-0">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import AppHeader from "@/components/AppHeader/AppHeader.vue";
</script>
<style></style>
