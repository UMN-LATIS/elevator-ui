<template>
  <div class="h-screen flex flex-col">
    <AppHeader class="top-0 w-full z-20 backdrop-blur-sm" />
    <div class="flex-1 mt-18 md:mt-0 overflow-auto">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import AppHeader from "@/components/AppHeader/AppHeader.vue";
</script>
<style></style>
