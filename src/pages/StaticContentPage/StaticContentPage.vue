<template>
  <DefaultLayout class="static-content-page">
    <template #custom-header>
      <CustomAppHeader
        v-if="instanceStore.customHeaderMode === ShowCustomHeaderMode.ALWAYS" />
    </template>
    <div
      v-if="page"
      class="static-content-page__content p-4 lg:p-8 mx-auto flex-1 w-full max-w-screen-xl">
      <a
        v-if="canCurrentUserEdit"
        :href="`${BASE_URL}/instances/editPage/${pageId}`"
        class="float-right uppercase text-xs font-medium bg-blue-100 px-2 py-1 rounded-md no-underline hover:bg-blue-600 hover:text-blue-100 hover:no-underline">
        Edit Page
      </a>
      <div class="prose prose-neutral mx-auto">
        <h1 class="text-4xl font-bold text-center">
          {{ page.title || "Untitled" }}
        </h1>

        <SanitizedHTML :html="page.content ?? ''" class="w-full" />
      </div>
    </div>
    <template #footer>
      <AppFooter
        v-if="instanceStore.customHeaderMode === ShowCustomHeaderMode.ALWAYS" />
    </template>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import CustomAppHeader from "@/components/CustomAppHeader/CustomAppHeader.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import AppFooter from "@/components/AppFooter/AppFooter.vue";
import { computed, nextTick, onUnmounted, toRef, watch } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";
import config from "@/config";
import { ShowCustomHeaderMode } from "@/types";
import { ELEVATOR_EVENTS } from "@/constants/constants";
import { onAllImagesLoaded } from "@/helpers/onAllImagesLoaded";
import { useStaticPageQuery } from "@/queries/useStaticPageQuery";

const instanceStore = useInstanceStore();

const props = defineProps<{
  pageId: number;
}>();

const BASE_URL = config.instance.base.path;
const pageIdRef = toRef(props, "pageId");

const canCurrentUserEdit = computed(() => {
  return (
    instanceStore.currentUser?.isAdmin ||
    instanceStore.currentUser?.isSuperAdmin
  );
});

const { CONTENT_LOADED, IMAGES_LOADED } = ELEVATOR_EVENTS.STATIC_CONTENT_PAGE;
const { data: page } = useStaticPageQuery(pageIdRef);

const dispatchEvent = (eventName: string, payload: Record<string, unknown>) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
};

let cleanupOnAllImagesLoaded: (() => void) | null = null;

// Emit custom events for external scripts (e.g. header/footer)
watch(
  page,
  async (newPage) => {
    if (!newPage) return;

    cleanupOnAllImagesLoaded?.();

    await nextTick();
    dispatchEvent(CONTENT_LOADED, { pageId: pageIdRef.value });

    cleanupOnAllImagesLoaded = onAllImagesLoaded(
      ".static-content-page__content",
      (images: HTMLImageElement[]) =>
        dispatchEvent(IMAGES_LOADED, { pageId: pageIdRef.value, images }),
      { timeout: 10000 }
    );
  },
  { immediate: true }
);

onUnmounted(() => {
  cleanupOnAllImagesLoaded?.();
});
</script>
<style scoped>
.static-content-page__content {
  background: var(--app-backgroundColor);
  color: var(--app-textColor);
}

.prose :first-child {
  margin-top: 0;
}
</style>
