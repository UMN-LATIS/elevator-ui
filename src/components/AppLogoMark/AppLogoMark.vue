<template>
  <div class="app-logo-mark flex gap-2 items-center">
    <img
      v-if="instanceStore.instance.logoImg"
      :src="instanceStore.instance.logoImg.src"
      :alt="instanceStore.instance.logoImg.alt"
      class="app-header__logo-img h-8" />
    <ElevatorIcon v-else class="h-full app-header__icon" />
    <div
      class="app-header__wordmark font-bold text-lg hidden md:block sm:max-w-[16rem] lg:max-w-[32rem] overflow-hidden overflow-ellipsis">
      {{ instanceStore.instance.name }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { useInstanceStore } from "@/stores/instanceStore";
import ElevatorIcon from "@/icons/ElevatorIcon.vue";

const instanceStore = useInstanceStore();
</script>
<style scoped>
.app-header__wordmark {
  color: var(--on-surface);
}
</style>
