<template>
  <nav
    class="app-menu flex flex-col w-[90vw] sm:w-md sm:p-8 p-4 h-full relative"
  >
    <XButton class="absolute right-4 top-4" @click="$emit('close')" />
    <header class="app-menu__header flex mt-4 py-4">
      <Link to="/">
        <h1 class="md:text-2xl text-lg font-bold">
          {{ instance.name }}
        </h1>
      </Link>
    </header>
    <div
      class="app-menu__items flex-1 py-4 border-y border-neutral-600 overflow-auto"
    >
      <slot />
    </div>
    <AppMenuAuthSection
      :instance="instance"
      :currentUser="currentUser"
      class="app-menu__auth-section py-4"
    />
    <footer
      class="app-menu__footer py-4 sm:flex flex-col items-center text-sm hidden"
    >
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
import Link from "@/components/Link/Link.vue";
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
<style scoped>
.app-menu {
  background: var(--app-appMenu-backgroundColor);
  color: var(--app-appMenu-textColor);
}
.app-menu__header a {
  color: var(--app-headingColor);
}

@media (max-height: 640px) {
  .app-menu__auth-section,
  .app-menu__footer,
  .app-menu__header {
    display: none;
  }

  .app-menu__items {
    border: none;
  }
}
</style>
