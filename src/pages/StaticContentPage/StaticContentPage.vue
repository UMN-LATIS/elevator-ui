<template>
  <DefaultLayout>
    <div
      v-if="page"
      class="static-page__content prose prose-neutral p-16 mx-auto"
    >
      <h1 class="text-4xl font-bold">
        {{ page.title || "No Title" }}
      </h1>
      <SanitizedHTML :html="page.content" />
    </div>
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
.static-page__content {
  background: var(--app-backgroundColor);
  color: var(--app-textColor);
}

.prose :first-child {
  margin-top: 0;
}
</style>
