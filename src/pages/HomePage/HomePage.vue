<template>
  <DefaultLayout>
    <PageContentPure v-if="page" :page="page" />
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { ref, watch } from "vue";
import { ApiStaticPageResponse } from "@/types";
import api from "@/api";
import { useInstanceStore } from "@/stores/instanceStore";
import PageContentPure from "@/components/PageContentPure/PageContentPure.vue";

const page = ref<ApiStaticPageResponse | null>(null);

const instanceStore = useInstanceStore();

watch(
  () => instanceStore.fetchStatus,
  async () => {
    if (instanceStore.fetchStatus !== "success") return;

    // find the pageId of the Home Page
    // the Home Page is just the first page with a title
    // of "Home Page"
    const homePageId = instanceStore.pages.find(
      (page) => page.title === "Home Page"
    )?.id;

    if (!homePageId) {
      // set the page content to something generic
      console.error("No Home Page found");
      page.value = {
        title: "No Home Page",
        content: `
        <p>Update your instance to set a Home Page</p>
        `,
      };
      return;
    }

    page.value = await api.getStaticPage(homePageId);
  },
  { immediate: true }
);
</script>
<style scoped></style>
