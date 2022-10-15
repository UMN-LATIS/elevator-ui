<template>
  <header class="bg-umn-gold-light flex justify-between items-center p-4">
    <div class="flex items-center gap-4">
      <a href="/">
        <h1 class="h-12">
          <img
            src="https://dev.elevator.umn.edu/assets/instanceAssets/7.png"
            alt="Elevator Digital Content Library logo"
            class="max-h-full"
          />
        </h1>
      </a>
    </div>
    <div class="flex items-center gap-4">
      <PageMenu :items="menuItems" />
      <LoginMenu />
    </div>
  </header>
</template>
<script setup lang="ts">
import { MenuItem, Image } from "@/types";
import PageMenu from "./PageMenu.vue";
import defaultLogoImg from "./defaultLogoImg";
import defaultPageMenuItems from "./defaultPageMenuItems";
import LoginMenu from "./LoginMenu.vue";

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
<style scoped></style>
