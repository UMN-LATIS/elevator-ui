<template>
  <DefaultLayout>
    <div v-if="page" class="prose mx-auto pt-8">
      <h1>{{ page.title }}</h1>
      <div v-html="page.content"></div>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { onMounted, ref } from "vue";
import { ApiStaticPageResponse } from "@/types";
import api from "@/api";

const props = defineProps<{
  pageId: string;
}>();

const page = ref<ApiStaticPageResponse | null>(null);

onMounted(async () => {
  page.value = await api.getStaticPage(props.pageId);
});
</script>
<style scoped></style>
