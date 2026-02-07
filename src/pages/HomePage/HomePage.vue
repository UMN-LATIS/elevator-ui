<template>
  <DefaultLayout class="home-page">
    <template #custom-header>
      <CustomAppHeader
        v-if="instanceStore.customHeaderMode !== ShowCustomHeaderMode.NEVER" />
    </template>
    <SignInRequiredNotice
      v-if="isReady && !canSearchAndBrowse && !instanceStore.isLoggedIn"
      class="my-8 mx-4" />
    <div
      v-if="isReady && canSearchAndBrowse"
      class="home-page-content flex-1 md:grid max-w-screen-xl w-full mx-auto md:grid-rows-1"
      :class="{
        'md:grid-cols-2': !featuredAssetId,
        'md:grid-cols-3': featuredAssetId,
      }">
      <article class="page-content-block col-span-2 p-4 lg:p-8">
        <Transition v-if="page" name="fade">
          <SanitizedHTML
            v-if="page.content"
            :html="page.content"
            class="prose prose-neutral"
            :class="{
              'mx-auto': !featuredAssetId,
            }" />
          <section v-else class="bg-white p-8 my-8 shadow-sm">
            <h1 class="text-4xl text-center font-bold">
              {{ instanceStore.instance?.name ?? "Elevator" }}
            </h1>
          </section>
        </Transition>
      </article>
      <aside
        v-if="featuredAssetId"
        class="featured-asset-block col-span-1 p-4 lg:p-8">
        <h2 class="text-sm font-bold uppercase mb-2">Featured</h2>
        <div class="mb-4">
          <SanitizedHTML :html="featuredAssetText" />
        </div>
        <FeaturedAssetCard :assetId="featuredAssetId" />
      </aside>
    </div>
    <Notification
      v-else-if="isReady && !canSearchAndBrowse && instanceStore.isLoggedIn"
      title="Nothing to See Here"
      class="my-8 mx-4">
      <p>
        Your account does not have permission to search and browse assets.
        Please contact your administrator if you believe this is an error.
      </p>
    </Notification>
    <template #footer>
      <AppFooter
        v-if="instanceStore.customHeaderMode !== ShowCustomHeaderMode.NEVER" />
    </template>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import { computed, nextTick, onUnmounted, watch } from "vue";
import { ShowCustomHeaderMode } from "@/types";
import { useInstanceStore } from "@/stores/instanceStore";
import FeaturedAssetCard from "@/components/FeaturedAssetCard/FeaturedAssetCard.vue";
import SignInRequiredNotice from "./SignInRequiredNotice.vue";
import Notification from "@/components/Notification/Notification.vue";
import AppFooter from "@/components/AppFooter/AppFooter.vue";
import CustomAppHeader from "@/components/CustomAppHeader/CustomAppHeader.vue";
import { useStaticPageQuery } from "@/queries/useStaticPageQuery";
import { useAssetQuery } from "@/queries/useAssetQuery";
import { ELEVATOR_EVENTS } from "@/constants/constants";
import { onAllImagesLoaded } from "@/helpers/onAllImagesLoaded";

const instanceStore = useInstanceStore();
const canSearchAndBrowse = computed(
  () => instanceStore.instance?.userCanSearchAndBrowse ?? false
);
const isReady = computed(() => instanceStore.isReady);

const featuredAssetId = computed(
  (): string | null => instanceStore.instance?.featuredAssetId ?? null
);
const featuredAssetText = computed(
  () => instanceStore.instance?.featuredAssetText ?? ""
);

// Find home page ID from instance pages
const homePageId = computed(() => {
  return (
    instanceStore.pages.find((page) => page.title === "Home Page")?.id ?? null
  );
});

// Fetch home page content (only when ready, can browse, and home page exists)
const { data: pageData } = useStaticPageQuery(
  homePageId, // Pass the computed directly
  {
    enabled: computed(
      () => isReady.value && canSearchAndBrowse.value && !!homePageId.value
    ),
  }
);

// Fetch featured asset (only when ready, can browse, and featured asset exists)
const { data: featuredAsset } = useAssetQuery(featuredAssetId, {
  enabled: computed(
    () => isReady.value && canSearchAndBrowse.value && !!featuredAssetId.value
  ),
});

// Provide fallback if no home page is configured
const page = computed(() => {
  return pageData.value ?? null;
});

// Determine when both queries are complete
const bothQueriesComplete = computed(() => {
  // Always wait for page
  if (!page.value) return false;

  // If there's a featured asset, wait for it too
  if (featuredAssetId.value && !featuredAsset.value) return false;

  return true;
});

const { CONTENT_LOADED, IMAGES_LOADED } = ELEVATOR_EVENTS.STATIC_CONTENT_PAGE;

const dispatchEvent = (eventName: string, payload: Record<string, unknown>) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
};

const cleanupFns = new Set<() => void>();

// Emit custom events when both page and featured asset (if any) are loaded
watch(
  bothQueriesComplete,
  async (isComplete) => {
    if (!isComplete) return;

    cleanupFns.forEach((fn) => fn());
    cleanupFns.clear();

    await nextTick();

    dispatchEvent(CONTENT_LOADED, {
      pageId: homePageId.value,
      featuredAssetId: featuredAssetId.value,
    });

    const cleanup = onAllImagesLoaded(
      ".home-page-content, .featured-asset-block",
      (images: HTMLImageElement[]) =>
        dispatchEvent(IMAGES_LOADED, {
          pageId: homePageId.value,
          featuredAssetId: featuredAssetId.value,
          images,
        }),
      { timeout: 10000 }
    );
    cleanupFns.add(cleanup);
  },
  { immediate: true }
);

onUnmounted(() => {
  cleanupFns.forEach((fn) => fn());
});
</script>
<style scoped>
.featured-asset-block,
.page-content-block {
  background: var(--surface);
  color: var(--on-surface);
}

.featured-asset-block {
  border-left: 1px solid var(--outline);
}
</style>
