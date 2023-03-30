<template>
  <DefaultLayout>
    <PageContentPure v-if="page" :page="page" />
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { ref, watch } from "vue";
import { StaticContentPage } from "@/types";
import api from "@/api";
import { useInstanceStore } from "@/stores/instanceStore";
import PageContentPure from "@/components/PageContentPure/PageContentPure.vue";

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
<style scoped></style>
