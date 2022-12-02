<template>
  <header class="app-header flex justify-between items-center px-4 py-2 gap-8">
    <div>
      <a
        :href="config.instance.base.url"
        class="flex items-center gap-4 hover:no-underline"
      >
        <ElevatorIcon class="h-full app-header__icon" />
        <h1 class="app-header__wordmark font-bold text-xl">
          {{ title }}
        </h1>
      </a>
    </div>
    <SearchBar class="flex-1 max-w-lg" />
    <div class="flex gap-2 items-center">
      <ThemeSelector />
      <Button
        variant="primary"
        class="app-header__menu-button rounded-full p-2"
      >
        <AppMenuButton />
      </Button>
    </div>
  </header>
</template>
<script setup lang="ts">
import defaultLogoImg from "./defaultLogoImg";
import defaultPageMenuItems from "./defaultPageMenuItems";
import Button from "@/components/Button/Button.vue";
import SearchBar from "@/components/SearchBar/SearchBar.vue";
import ThemeSelector from "@/components/ThemeSelector/ThemeSelector.vue";
import AppMenuButton from "./AppMenuButton.vue";
import config from "@/config";
import { ElevatorIcon } from "@/icons";
import { MenuItem, Image } from "@/types";

withDefaults(
  defineProps<{
    logoImg?: Image;
    menuItems?: MenuItem[];
    title?: string;
  }>(),
  {
    logoImg: () => defaultLogoImg,
    menuItems: () => defaultPageMenuItems,
    title: () => config.instance.name,
  }
);
</script>
<style scoped lang="postcss">
.app-header {
  background: var(--app-appHeader-backgroundColor);
  border-bottom: var(--app-borderWidth) solid
    var(--app-appHeader-borderBottomColor);
  color: var(--app-appHeader-textColor);
}
.app-header__wordmark {
  color: var(--app-appHeader-wordmark-textColor);
}

.app-header__icon {
  color: var(--app-appHeader-logo-color);
}

.app-header__menu-button {
  background: var(--app-appHeader-menuButton-backgroundColor);
  color: var(--app-appHeader-menuButton-textColor);
  border: var(--app-appHeader-menuButton-borderWidth) solid
    var(--app-appHeader-menuButton-borderColor);
  &:hover {
    background: var(--app-appHeader-menuButton-hover-backgroundColor);
    color: var(--app-appHeader-menuButton-hover-textColor);
    border-color: var(--app-appHeader-menuButton-hover-borderColor);
  }
  &:active {
    background: var(--app-appHeader-menuButton-active-backgroundColor);
    color: var(--app-appHeader-menuButton-active-textColor);
    border-color: var(--app-appHeader-menuButton-active-borderColor);
  }
}
</style>
