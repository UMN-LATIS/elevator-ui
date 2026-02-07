<template>
  <header
    class="app-header flex flex-col bg-surface border-b-2 border-outline-variant text-on-surface">
    <div class="flex justify-between items-center md:gap-8 px-4 py-2">
      <div class="flex gap-2 items-center">
        <Link
          to="/"
          class="app-header__logo-link hover:no-underline mr-4 text-on-surface">
          <AppLogoMark />
        </Link>
      </div>
      <SearchBar
        v-if="instanceStore.instance.userCanSearchAndBrowse"
        class="flex-1 w-full max-w-2xl" />
      <div class="flex gap-2 items-center">
        <AuthDropDown
          :currentUser="currentUser"
          :instance="instanceStore.instance" />
        <AppMenuButton />
      </div>
    </div>
    <div v-if="$slots.default" class="app-header__secondary-nav">
      <slot />
    </div>
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
<style scoped>
.app-header__secondary-nav {
  background: transparent;
}
</style>
