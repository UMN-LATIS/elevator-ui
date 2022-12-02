<template>
  <header class="app-header flex justify-between items-center px-4 py-4 gap-8">
    <div class="flex gap-2 items-center">
      <a
        :href="config.instance.base.url"
        class="app-header__logo-link hover:no-underline"
      >
        <AppLogoMark />
      </a>
    </div>
    <SearchBar class="flex-1 w-full max-w-lg" />
    <div class="flex gap-2 items-center">
      <ThemeSelector
        v-show="config.instance.theming.enabled"
        :defaultTheme="config.instance.theming.defaultTheme"
      />
      <AuthDropDown
        :currentUser="instanceStore.currentUser"
        :instance="instanceStore.instance"
      />
      <AppMenuButton />
    </div>
  </header>
</template>
<script setup lang="ts">
import config from "@/config";
import AppMenuButton from "@/components/AppMenuButton/AppMenuButton.vue";
import ThemeSelector from "@/components/ThemeSelector/ThemeSelector.vue";
import SearchBar from "@/components/SearchBar/SearchBar.vue";
import AppLogoMark from "@/components/AppLogoMark/AppLogoMark.vue";
import AuthDropDown from "./AuthDropDown.vue";
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
.app-header__logo-link {
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
