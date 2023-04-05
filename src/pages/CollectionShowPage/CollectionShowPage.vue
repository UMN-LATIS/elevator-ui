<template>
  <DefaultLayout>
    <div v-if="collection">
      <h2>Browsing {{ collection.title }}</h2>
    </div>

    <div ref="searchResultsContainer" class="grid grid-cols-auto-md gap-4">
      <TransitionGroup
        enterActiveClass="transform ease-out transition"
        enterFromClass="opacity-0"
        enterToClass="opacity-100"
        leaveActiveClass="transition ease-in"
        leaveFromClass="opacity-100"
        leaveToClass="opacity-0"
      >
        <SkeletonMediaCard v-for="i in 10" :key="i" />
      </TransitionGroup>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useInstanceStore } from "@/stores/instanceStore";
import { computed, watch } from "vue";
import SkeletonMediaCard from "@/components/MediaCard/SkeletonMediaCard.vue";
import api from "@/api";
import { useRouter } from "vue-router";

const props = defineProps<{
  collectionId: number;
}>();

const instanceStore = useInstanceStore();
const collection = computed(() =>
  instanceStore.collections.find((c) => c.id === props.collectionId)
);
const router = useRouter();

watch(
  () => props.collectionId,
  async () => {
    // get the searchId for this collection
    // and then redirect to the search page
    const searchId = await api.getSearchIdForCollection(props.collectionId);
    router.push({ name: "search", params: { searchId } });
  },
  { immediate: true }
);
</script>
<style scoped></style>
