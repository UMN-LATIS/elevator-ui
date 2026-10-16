<template>
  <DefaultLayout class="home-page">
    <template #custom-header>
      <CustomAppHeader v-if="customHeaderMode !== ShowCustomHeaderMode.NEVER" />
    </template>
    <SignInRequiredNotice
      v-if="!canSearchAndBrowse && !isLoggedIn"
      class="my-8 mx-4" />
    <div
      v-if="canSearchAndBrowse"
      class="home-page-content flex-1 md:grid max-w-screen-xl w-full mx-auto md:grid-rows-1"
      :class="{
        'md:grid-cols-2': !featuredAssetId,
        'md:grid-cols-3': featuredAssetId,
      }">
      <article class="page-content-block col-span-2 p-4 lg:p-8">
        <Button
          v-if="canCurrentUserEdit"
          :to="`/instances/editPage/${homePageId}`"
          variant="tertiary"
          class="float-right">
          Edit Page
        </Button>
        <Transition v-if="homePageContent" name="fade">
          <SanitizedHTML
            v-if="homePageContent.content"
            :html="homePageContent.content"
            class="prose"
            :class="{
              'mx-auto': !featuredAssetId,
            }" />
          <section v-else class="p-8 my-8 shadow-sm">
            <h1 class="text-4xl text-center font-bold">
              {{ instance?.name ?? "Elevator" }}
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
      v-else-if="isLoggedIn"
      title="Nothing to See Here"
      class="my-8 mx-4">
      <p>
        Your account does not have permission to search and browse assets.
        Please contact your administrator if you believe this is an error.
      </p>
    </Notification>
    <template #footer>
      <AppFooter v-if="customHeaderMode !== ShowCustomHeaderMode.NEVER" />
    </template>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import { computed, nextTick, onUnmounted, watch } from "vue";
import { ShowCustomHeaderMode } from "@/types";
import FeaturedAssetCard from "@/components/FeaturedAssetCard/FeaturedAssetCard.vue";
import SignInRequiredNotice from "./SignInRequiredNotice.vue";
import Notification from "@/components/Notification/Notification.vue";
import AppFooter from "@/components/AppFooter/AppFooter.vue";
import CustomAppHeader from "@/components/CustomAppHeader/CustomAppHeader.vue";
import { useCustomPageViewQuery } from "@/queries/customPageQueries";
import { useAssetQuery } from "@/queries/useAssetQuery";
import { ELEVATOR_EVENTS } from "@/constants/constants";
import { onAllImagesLoaded } from "@/helpers/onAllImagesLoaded";
import Button from "@/components/Button/Button.vue";
import { useCurrentUser } from "@/composables/useCurrentUser";
import { useElevatorInstance } from "@/composables/useElevatorInstance";
import { useNavPages } from "@/composables/useNavPages";
import { useCustomHeaderFooter } from "@/composables/useCustomHeaderFooter";

const { currentUser, isLoggedIn, canSearchAndBrowse } = useCurrentUser();
const { instance } = useElevatorInstance();
const { homePageId } = useNavPages();
const { customHeaderMode } = useCustomHeaderFooter();

// Fetch home page content (only when ready, can browse, and home page exists)
const { data: homePageContent } = useCustomPageViewQuery(
  homePageId, // Pass the computed directly
  {
    enabled: computed(() => canSearchAndBrowse.value && !!homePageId.value),
  }
);

const featuredAssetId = computed(() => instance.value?.featuredAssetId ?? null);
const featuredAssetText = computed(
  () => instance.value?.featuredAssetText ?? ""
);

// Fetch featured asset (only when ready, can browse, and featured asset exists)
const { data: featuredAsset } = useAssetQuery(featuredAssetId, {
  enabled: () => canSearchAndBrowse.value && !!featuredAssetId.value,
});

const canCurrentUserEdit = computed(() => {
  return currentUser.value?.isAdmin || currentUser.value?.isSuperAdmin;
});

// Determine when both queries are complete
const bothQueriesComplete = computed(() => {
  // Always wait for page
  if (!homePageContent.value) return false;

  // If there's a featured asset, wait for it too
  if (featuredAssetId.value && !featuredAsset.value) return false;

  return true;
});

const { CONTENT_LOADED, IMAGES_LOADED } = ELEVATOR_EVENTS.STATIC_CONTENT_PAGE;

// for any in-page scripts which might be listening
// for load
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
</style>
