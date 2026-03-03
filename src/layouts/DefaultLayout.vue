<template>
  <div
    id="top"
    ref="topSentinel"
    class="default-layout bg-surface min-h-screen pt-18 flex flex-col">
    <SkipNavLink href="#main" />
    <slot name="custom-header" />
    <AppHeader class="app-header top-0 w-full z-20 sticky left-0" />

    <main id="main" class="flex-1 flex flex-col" tabindex="-1">
      <!-- Not Authenticated -->
      <div v-if="requiresAuth && !currentUser" class="p-8">
        <SignInRequiredNotice />
      </div>

      <!-- Not Authorized -->
      <div v-else-if="!canAccess" class="p-8">
        <h1 class="text-8xl font-bold text-on-surface-variant">403</h1>
        <h2 class="text-4xl mb-8">Forbidden</h2>
        <p class="my-4">You do not have permission to view this page.</p>
        <Button :to="{ name: 'home' }" icon="home" iconPosition="start">
          Go Home
        </Button>
      </div>

      <!-- All good -->
      <template v-else>
        <ErrorBoundary>
          <slot />
        </ErrorBoundary>
      </template>
    </main>
    <slot name="footer" />
    <Transition name="fade">
      <a
        v-show="showScrollToTop"
        href="#top"
        class="fixed bottom-24 right-2 lg:bottom-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary-container z-20">
        <ChevronUpIcon />
        <span class="sr-only">Top</span>
      </a>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import AppHeader from "@/components/AppHeader/AppHeader.vue";
import { ChevronUpIcon } from "@/icons";
import { useIntersectionObserver } from "@vueuse/core";
import SkipNavLink from "@/components/SkipNavLink/SkipNavLink.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { useRoute } from "vue-router";
import SignInRequiredNotice from "@/pages/HomePage/SignInRequiredNotice.vue";
import Button from "@/components/Button/Button.vue";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary.vue";

// IntersectionObserver fires only when the sentinel enters/leaves the viewport —
// no per-scroll-tick reactive updates, unlike useWindowScroll().
const topSentinel = ref<HTMLElement | null>(null);
const showScrollToTop = ref(false);
useIntersectionObserver(topSentinel, ([entry]) => {
  showScrollToTop.value = !entry.isIntersecting;
});

const instanceStore = useInstanceStore();
const route = useRoute();

const requiresAuth = computed(() => {
  return route.meta.requiresAuth ?? false;
});

const currentUser = computed(() => instanceStore.currentUser);

const canAccess = computed(() => {
  if (!requiresAuth.value) return true;
  if (!route.meta.canAccess) return true;

  return currentUser.value && route.meta.canAccess(currentUser.value);
});
</script>
<style></style>
