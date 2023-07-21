<template>
  <div id="top" class="min-h-screen pt-18 flex flex-col">
    <SkipNavLink href="#main" />
    <AppHeader class="app-header top-0 w-full z-20 sticky left-0" />

    <main id="main" class="flex-1 flex flex-col" tabindex="-1">
      <slot />
    </main>
    <AppFooter />
    <Transition name="fade">
      <a
        v-show="showScrollToTop"
        href="#top"
        class="fixed bottom-2 right-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-100 z-20"
      >
        <ChevronUpIcon />
        <span class="sr-only">Top</span>
      </a>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import AppHeader from "@/components/AppHeader/AppHeader.vue";
import AppFooter from "@/components/AppFooter/AppFooter.vue";
import { ChevronUpIcon } from "@/icons";
import { useWindowScroll } from "@vueuse/core";
import SkipNavLink from "@/components/SkipNavLink/SkipNavLink.vue";

const { y: scrollY } = useWindowScroll();

const showScrollToTop = computed(() => {
  return scrollY.value > 0;
});
</script>
<style></style>
