<template>
  <header class="app-header flex justify-between items-center px-4 py-2">
    <div class="flex items-center gap-4">
      <a :href="config.base.url">
        <h1 class="h-12">
          <img
            src="https://dev.elevator.umn.edu/assets/instanceAssets/7.png"
            alt="Elevator Digital Content Library logo"
            class="max-h-full"
          />
        </h1>
      </a>
    </div>
    <div class="flex gap-2 items-center">
      <ThemeSelector />
      <Button variant="primary" class="rounded-full p-2"><MenuIcon /></Button>
    </div>
  </header>
</template>
<script setup lang="ts">
import { MenuItem, Image } from "@/types";
import defaultLogoImg from "./defaultLogoImg";
import defaultPageMenuItems from "./defaultPageMenuItems";
import Button from "@/components/Button/Button.vue";
import config from "@/config";
import MenuIcon from "@/icons/MenuIcon.vue";
import ThemeIcon from "@/icons/ThemeIcon.vue";
import ThemeSelector from "../ThemeSelector/ThemeSelector.vue";

withDefaults(
  defineProps<{
    logoImg?: Image;
    menuItems?: MenuItem[];
  }>(),
  {
    logoImg: () => defaultLogoImg,
    menuItems: () => defaultPageMenuItems,
  }
);
</script>
<style scoped>
.app-header {
  background: var(--app-appHeader-backgroundColor);
  border-bottom: var(--app-borderWidth) solid var(--app-borderColor);
}
</style>
