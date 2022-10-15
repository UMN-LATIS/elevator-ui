<template>
  <div class="h-screen flex flex-col">
    <AppHeader :logoImg="logoImg" :menuItems="menuItems" class="" />
    <div class="flex-1">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import AppHeader from "@/components/AppHeader/AppHeader.vue";
import type { Image, MenuItem } from "@/types";

defineProps<{
  logoImg?: Image;
  menuItems?: MenuItem[];
}>();
</script>
<style></style>
