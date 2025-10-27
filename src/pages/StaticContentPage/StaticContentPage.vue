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
import { computed, ref, watch, nextTick } from "vue";
import { ApiStaticPageResponse } from "@/types";
import { useInstanceStore } from "@/stores/instanceStore";
import api from "@/api";
import config from "@/config";
import { ShowCustomHeaderMode } from "@/types";
import { ELEVATOR_EVENTS } from "@/constants/constants";

const instanceStore = useInstanceStore();

const props = defineProps<{
  pageId: number;
}>();

const BASE_URL = config.instance.base.path;
const page = ref<ApiStaticPageResponse | null>(null);

const canCurrentUserEdit = computed(() => {
  return (
    instanceStore.currentUser?.isAdmin ||
    instanceStore.currentUser?.isSuperAdmin
  );
});

watch(
  () => props.pageId,
  async () => {
    page.value = await api.getStaticPage(props.pageId);
    // Wait for Vue to render the DOM before firing the event
    await nextTick();
    // fire custom event to notify any 3rd party scripts that the page content has loaded
    const contentLoadedEvent = new CustomEvent(
      ELEVATOR_EVENTS.CONTENT_PAGE_LOADED
    );
    window.dispatchEvent(contentLoadedEvent);

    // Wait for all images to load
    const container = document.querySelector(".static-content-page__content");
    if (container) {
      const images = container.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve());
            img.addEventListener("error", () => resolve());
          });
        })
      );

      // Fire images loaded event
      const imagesLoadedEvent = new CustomEvent(
        ELEVATOR_EVENTS.CONTENT_PAGE_IMAGES_LOADED
      );
      window.dispatchEvent(imagesLoadedEvent);
    }
  },
  { immediate: true }
);
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
