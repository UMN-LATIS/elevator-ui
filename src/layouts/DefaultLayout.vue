<template>
  <div class="h-screen flex flex-col">
    <AppHeader class="top-0 w-full z-20 backdrop-blur-sm" />
    <div ref="contentContainer" class="flex-1 mt-18 md:mt-0 overflow-auto">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import AppHeader from "@/components/AppHeader/AppHeader.vue";
import { useScroll, useSessionStorage } from "@vueuse/core";
import { onBeforeRouteUpdate, onBeforeRouteLeave, useRoute } from "vue-router";

const contentContainer = ref<HTMLElement | undefined>();

interface ScrollYHistory {
  [route: string]: number;
}

const scrollYHistory = useSessionStorage<ScrollYHistory>("scrollY_history", {});
const { y } = useScroll(contentContainer);
const route = useRoute();

watch(
  route,
  () => {
    const newPathScrollY = scrollYHistory.value[route.path] ?? 0;
    nextTick(() => {
      contentContainer.value?.scrollTo(0, newPathScrollY);
    });
  },
  { immediate: true }
);

onBeforeRouteUpdate((to, from) => {
  console.log("before route update", { y: y.value, to, from });
  scrollYHistory.value[from.path] = y.value;
});

onBeforeRouteLeave((to, from) => {
  console.log("before route leave", { y: y.value, to, from });
  scrollYHistory.value[from.path] = y.value;
});
</script>
<style></style>
