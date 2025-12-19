<template>
  <div class="no-scroll-layout h-dvh flex flex-col">
    <CustomAppHeader v-if="instanceStore.customHeaderMode == 1" />
    <AppHeader class="top-0 w-full z-20 backdrop-blur-sm">
      <slot name="secondaryAppHeader" />
    </AppHeader>
    <div ref="contentContainer" class="flex-1 mt-18 md:mt-0 overflow-auto">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import AppHeader from "@/components/AppHeader/AppHeader.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import CustomAppHeader from "@/components/CustomAppHeader/CustomAppHeader.vue";
const instanceStore = useInstanceStore();
</script>
<style></style>
