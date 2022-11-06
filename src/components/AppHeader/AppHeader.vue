<template>
  <header
    class="bg-app-appHeader flex justify-between items-center p-4 border-b-app"
  >
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
  </header>
</template>
<script setup lang="ts">
import { MenuItem, Image } from "@/types";
import defaultLogoImg from "./defaultLogoImg";
import defaultPageMenuItems from "./defaultPageMenuItems";
import config from "@/config";

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
