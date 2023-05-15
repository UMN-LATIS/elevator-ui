<template>
  <header class="app-header px-4 py-2 flex flex-col gap-2">
    <div class="flex justify-between items-center gap-8">
      <div class="flex gap-2 items-center">
        <Link to="/" class="app-header__logo-link hover:no-underline">
          <AppLogoMark />
        </Link>
      </div>
      <SearchBar
        v-if="instanceStore.instance.userCanSearchAndBrowse"
        class="flex-1 w-full max-w-lg"
      />
      <div class="flex gap-2 items-center">
        <AuthDropDown
          :currentUser="currentUser"
          :instance="instanceStore.instance"
        />
        <AppMenuButton />
      </div>
    </div>
    <slot />
  </header>
</template>
<script setup lang="ts">
import { computed } from "vue";
import AppMenuButton from "@/components/AppMenuButton/AppMenuButton.vue";
import SearchBar from "@/components/SearchBar/SearchBar.vue";
import AppLogoMark from "@/components/AppLogoMark/AppLogoMark.vue";
import Link from "@/components/Link/Link.vue";
import AuthDropDown from "@/components/AuthDropDown/AuthDropDown.vue";
import { useInstanceStore } from "@/stores/instanceStore";

const instanceStore = useInstanceStore();

const currentUser = computed(() => instanceStore.currentUser);
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
