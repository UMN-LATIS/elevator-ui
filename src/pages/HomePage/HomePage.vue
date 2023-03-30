<template>
  <DefaultLayout>
    <article
      v-if="page"
      class="static-page-content m-auto sm:max-w-3xl p-4 sm:p-12 rounded shadow sm:px-12 sm:my-8"
    >
      <SanitizedHTML :html="page.content" class="prose prose-neutral" />
    </article>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import { ref, watch } from "vue";
import { StaticContentPage } from "@/types";
import { useInstanceStore } from "@/stores/instanceStore";
import api from "@/api";

const page = ref<StaticContentPage | null>(null);
const instanceStore = useInstanceStore();

const fallbackHomePage: StaticContentPage = {
  title: "No Home Page",
  content: `<p>Update your instance to set a Home Page</p>`,
};

// the Home Page is just the first page with a title of "Home Page"
function findHomePageId() {
  return instanceStore.pages.find((page) => page.title === "Home Page")?.id;
}

async function fetchHomePage(homePageId: number | undefined) {
  if (!homePageId) return fallbackHomePage;
  return api.getStaticPage(homePageId);
}

watch(
  () => instanceStore.fetchStatus,
  async () => {
    if (instanceStore.fetchStatus !== "success") return;
    const homePageId = findHomePageId();
    page.value = await fetchHomePage(homePageId);
  },
  { immediate: true }
);
</script>
<style scoped>
.static-page-content {
  background: var(--app-metaDataOnlyView-contentViewer-backgroundColor);
  color: var(--app-metaDataOnlyView-contentViewer-textColor);
}
</style>
