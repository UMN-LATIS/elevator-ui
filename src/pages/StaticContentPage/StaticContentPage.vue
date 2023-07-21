<template>
  <DefaultLayout>
    <div
      v-if="page"
      class="static-page__content p-4 lg:p-8 mx-auto flex-1 w-full max-w-screen-xl"
    >
      <div class="prose prose-neutral">
        <h1 class="text-4xl font-bold">
          {{ page.title || "No Title" }}
        </h1>
        <SanitizedHTML :html="page.content ?? ''" class="w-full" />
      </div>
    </div>
    <AppFooter />
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import AppFooter from "@/components/AppFooter/AppFooter.vue";
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
