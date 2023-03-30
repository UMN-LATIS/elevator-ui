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
import PageContentPure from "@/components/PageContentPure/PageContentPure.vue";

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
<style scoped></style>
