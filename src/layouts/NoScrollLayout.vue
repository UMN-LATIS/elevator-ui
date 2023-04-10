<template>
  <div class="h-screen flex flex-col">
    <AppHeader class="top-0 w-full z-20 backdrop-blur-sm" />
    <PrevNextSearchResultNav
      v-if="searchStore.searchId"
      class="border-b sticky"
    />
    <div ref="contentContainer" class="flex-1 mt-18 md:mt-0 overflow-auto">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import AppHeader from "@/components/AppHeader/AppHeader.vue";
import PrevNextSearchResultNav from "@/components/PrevNextSearchResultNav/PrevNextSearchResultNav.vue";
import { useSearchStore } from "@/stores/searchStore";

const searchStore = useSearchStore();
</script>
<style></style>
