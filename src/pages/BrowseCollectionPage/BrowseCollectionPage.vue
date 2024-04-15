<template>
  <DefaultLayout class="browse-collection-page">
    <!-- redirect to search results page -->
  </DefaultLayout>
</template>
<script setup lang="ts">
import { watch } from "vue";
import { useRouter } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import api from "@/api";

const props = defineProps<{
  collectionId: number;
}>();

const router = useRouter();

watch(
  [() => props.collectionId],
  async () => {
    // redirect to search results page
    const searchId = await api.getSearchIdForCollection(props.collectionId);
    router.replace(`/search/s/${searchId}`);
  },
  { immediate: true }
);
</script>
<style scoped></style>
