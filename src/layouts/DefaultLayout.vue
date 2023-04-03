<template>
  <div class="min-h-screen pt-18">
    <AppHeader class="top-0 w-full z-20 sticky left-0" />
    <slot />
  </div>
</template>
<script setup lang="ts">
import AppHeader from "@/components/AppHeader/AppHeader.vue";
</script>
<style></style>
