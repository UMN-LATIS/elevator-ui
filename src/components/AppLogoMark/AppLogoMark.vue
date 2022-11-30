<template>
  <div class="flex gap-2">
    <img
      v-if="instanceStore.instance.logoImg"
      :src="instanceStore.instance.logoImg.src"
      :alt="instanceStore.instance.logoImg.alt"
      class="app-header__logo-img h-8"
    />
    <ElevatorIcon v-else class="h-full app-header__icon" />
    <h1 class="app-header__wordmark font-bold text-xl">
      {{ instanceStore.instance.name }}
    </h1>
  </div>
</template>
<script setup lang="ts">
import { useInstanceStore } from "@/stores/instanceStore";

const instanceStore = useInstanceStore();
</script>
<style scoped></style>
