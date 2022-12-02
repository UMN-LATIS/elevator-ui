<template>
  <div class="h-screen flex flex-col">
    <AppHeader />
    <div class="flex-1">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import AppHeader from "@/components/AppHeader/AppHeader.vue";
</script>
<style></style>
