<template>
  <DefaultLayout>
    <article
      v-if="page"
      class="static-page-content m-auto sm:max-w-3xl p-4 sm:p-12 rounded shadow sm:px-12 sm:my-8"
    >
      <h2 class="text-3xl mb-12 sm:text-5xl font-bold mt-4">
        {{ page.title || "No Title" }}
      </h2>

      <SanitizedHTML :html="page.content" class="prose prose-neutral" />
    </article>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import { ref, watch } from "vue";
import { ApiStaticPageResponse } from "@/types";
import api from "@/api";

const props = defineProps<{
  pageId: number;
}>();

const page = ref<ApiStaticPageResponse | null>(null);

watch(
  () => props.pageId,
  async () => {
    page.value = await api.getStaticPage(props.pageId);
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
