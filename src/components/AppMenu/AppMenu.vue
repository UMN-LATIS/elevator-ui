<template>
  <nav class="app-menu flex flex-col max-w-md">
    <header class="py-4 flex">
      <AppLogoMark />
    </header>
    <div class="app-menu__content flex-1 border-y-transparent-white-500">
      <slot />
    </div>
    <footer class="py-4">
      <p>
        Powered by <a href="https://umn-latis.github.io/elevator/">Elevator</a>
      </p>
      <p>
        Made by
        <a href="https://umn.edu">
          <UMNLogo />
        </a>
      </p>
    </footer>
  </nav>
</template>
<script setup lang="ts">
import UMNLogo from "@/icons/UMNLogo.vue";

import { useInstanceStore } from "@/stores/instanceStore";
import AppLogoMark from "../AppLogoMark/AppLogoMark.vue";

const instanceStore = useInstanceStore();
</script>
<style scoped>
.app-menu {
  background: var(--app-menu-backgroundColor);
  color: var(--app-menu-textColor);
}
</style>
