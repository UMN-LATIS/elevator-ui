<template>
  <header
    class="app-header flex flex-col bg-surface-container-high text-on-surface border-0 border-b border-outline-variant">
    <div class="flex justify-between items-center md:gap-8 px-4 py-2">
      <div class="flex gap-2 items-center">
        <Link to="/" class="app-header__logo-link hover:no-underline mr-4">
          <AppLogoMark />
        </Link>
      </div>
      <SearchBar v-if="canSearchAndBrowse" class="flex-1 w-full max-w-2xl" />
      <div class="flex gap-2 items-center">
        <AuthDropDown
          v-if="instance"
          :currentUser="currentUser"
          :instance="instance" />
        <AppMenuButton />
      </div>
    </div>
    <div
      v-if="$slots.default"
      class="app-header__secondary-nav bg-surface-container text-on-surface"></div>
  </header>
</template>
<script setup lang="ts">
import AppMenuButton from "@/components/AppMenuButton/AppMenuButton.vue";
import SearchBar from "@/components/SearchBar/SearchBar.vue";
import AppLogoMark from "@/components/AppLogoMark/AppLogoMark.vue";
import Link from "@/components/Link/Link.vue";
import AuthDropDown from "@/components/AuthDropDown/AuthDropDown.vue";
import { useCurrentUser } from "@/composables/useCurrentUser";
import { useElevatorInstance } from "@/composables/useElevatorInstance";

const { currentUser, canSearchAndBrowse } = useCurrentUser();
const { instance } = useElevatorInstance();
</script>
<style scoped></style>
