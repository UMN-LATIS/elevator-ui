<template>
  <header class="app-header-wrap flex">
    <div class="app-header flex justify-between items-center px-4 py-2 flex-1">
      <div class="flex gap-2">
        <a
          :href="config.instance.base.url"
          class="flex items-center gap-2 hover:no-underline"
        >
          <img
            v-if="instanceStore.instance.logoImg"
            :src="instanceStore.instance.logoImg.src"
            :alt="instanceStore.instance.logoImg.alt"
            class="h-8"
          />
          <ElevatorIcon v-else class="h-full app-header__icon" />
          <h1 class="app-header__wordmark font-bold text-xl">
            {{ instanceStore.instance.name }}
          </h1>
        </a>
      </div>
      <div class="flex gap-2 items-center">
        <ThemeSelector />
        <AppMenuButton />
      </div>
    </div>
  </header>
</template>
<script setup lang="ts">
import config from "@/config";
import AppMenuButton from "./AppMenuButton.vue";
import ThemeSelector from "../ThemeSelector/ThemeSelector.vue";
import ElevatorIcon from "@/icons/ElevatorIcon.vue";
import { useInstanceStore } from "@/stores/instanceStore";

const instanceStore = useInstanceStore();
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
