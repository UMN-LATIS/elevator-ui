<template>
  <DefaultLayout class="static-content-page">
    <template #custom-header>
      <CustomAppHeader
        v-if="customHeaderMode === ShowCustomHeaderMode.ALWAYS" />
    </template>
    <div
      v-if="page"
      class="static-content-page__content p-4 lg:p-8 mx-auto flex-1 w-full max-w-screen-xl">
      <article class="mx-auto">
        <header class="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-8">
          <h1
            class="static-content-page__page-title col-start-2 text-4xl font-bold text-center">
            {{ page.title || "Untitled" }}
          </h1>
          <Button
            v-if="canCurrentUserEdit"
            :to="`/instances/editPage/${pageId}`"
            variant="tertiary"
            class="col-start-3 justify-self-end">
            Edit Page
          </Button>
        </header>

        <SanitizedHTML
          :html="page.content ?? ''"
          class="w-full prose mx-auto"
          :addTags="['style']" />
      </article>
    </div>
    <template #footer>
      <AppFooter v-if="customHeaderMode === ShowCustomHeaderMode.ALWAYS" />
    </template>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import CustomAppHeader from "@/components/CustomAppHeader/CustomAppHeader.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import AppFooter from "@/components/AppFooter/AppFooter.vue";
import { computed, nextTick, onUnmounted, watch } from "vue";
import { ShowCustomHeaderMode } from "@/types";
import { ELEVATOR_EVENTS } from "@/constants/constants";
import { onAllImagesLoaded } from "@/helpers/onAllImagesLoaded";
import { useCustomPageViewQuery } from "@/queries/customPageQueries";
import Button from "@/components/Button/Button.vue";
import { useCurrentUser } from "@/composables/useCurrentUser";
import { useCustomHeaderFooter } from "@/composables/useCustomHeaderFooter";

const props = defineProps<{
  pageId: number;
}>();

const { currentUser } = useCurrentUser();
const { customHeaderMode } = useCustomHeaderFooter();

const canCurrentUserEdit = computed((): boolean => {
  if (!currentUser.value) {
    return false;
  }
  const { isAdmin, isSuperAdmin } = currentUser.value;
  return isAdmin || isSuperAdmin;
});

const { CONTENT_LOADED, IMAGES_LOADED } = ELEVATOR_EVENTS.STATIC_CONTENT_PAGE;
const { data: page } = useCustomPageViewQuery(() => props.pageId);

const dispatchEvent = (eventName: string, payload: Record<string, unknown>) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
};

let cleanupOnAllImagesLoaded: (() => void) | null = null;

// Emit custom events for external scripts (e.g. header/footer)
watch(
  page,
  async (newPage) => {
    if (!newPage) return;

    const pageId = props.pageId;
    cleanupOnAllImagesLoaded?.();

    await nextTick();
    dispatchEvent(CONTENT_LOADED, { pageId });

    cleanupOnAllImagesLoaded = onAllImagesLoaded(
      ".static-content-page__content",
      (images: HTMLImageElement[]) =>
        dispatchEvent(IMAGES_LOADED, { pageId, images }),
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
  background: var(--surface);
  color: var(--on-surface);
}

.prose :first-child {
  margin-top: 0;
}
</style>
