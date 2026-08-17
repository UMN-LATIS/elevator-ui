<template>
  <div class="app-logo-mark flex gap-2 items-center text-on-surface">
    <img
      v-if="instance?.logoImg"
      :src="instance.logoImg.src"
      :alt="instance.logoImg.alt"
      class="app-header__logo-img h-8" />
    <ElevatorIcon v-else class="h-full app-header__icon" />
    <div
      class="app-header__wordmark font-bold text-lg hidden md:block sm:max-w-[16rem] lg:max-w-[32rem] overflow-hidden overflow-ellipsis">
      {{ instance?.name }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { useElevatorInstance } from "@/composables/useElevatorInstance";
import ElevatorIcon from "@/icons/ElevatorIcon.vue";

const { instance } = useElevatorInstance();
</script>
