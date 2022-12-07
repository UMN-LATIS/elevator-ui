<template>
  <nav
    class="app-menu flex flex-col w-[90vw] sm:w-md sm:p-8 p-4 h-screen relative"
  >
    <XButton class="absolute right-4 top-4" @click="$emit('close')" />
    <header class="flex mt-4 py-4">
      <h1 class="md:text-2xl text-lg font-bold">
        {{ instance.name }}
      </h1>
    </header>
    <div
      class="app-menu__items flex-1 py-4 border-y border-neutral-600 overflow-auto"
    >
      <slot />
    </div>
    <AppMenuAuthSection
      :instance="instance"
      :currentUser="currentUser"
      class="py-4"
    />
    <footer class="py-4 sm:flex flex-col items-center text-sm hidden">
      <p>
        Powered by <a href="https://umn-latis.github.io/elevator/">Elevator</a>
      </p>
      <p>
        Made by
        <a href="https://umn.edu">
          <UMNLogo class="inline-block w-6" />
        </a>
      </p>
    </footer>
  </nav>
</template>
<script setup lang="ts">
import XButton from "@/components/XButton/XButton.vue";
import AppMenuAuthSection from "./AppMenuAuthSection.vue";
import { ElevatorInstance, User } from "@/types";
import UMNLogo from "@/icons/UMNLogo.vue";

defineProps<{
  instance: ElevatorInstance;
  currentUser: User | null;
}>();

defineEmits<{
  (eventName: "close"): void;
}>();
</script>
<style scoped></style>
