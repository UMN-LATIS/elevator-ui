<template>
  <div class="search-results-page__browser-collection-header">
    <header class="pb-8 my-8">
      <nav aria-label="Breadcrumb">
        <ol
          class="flex flex-wrap items-center gap-1 text-sm text-on-surface-variant">
          <li>
            <Link :to="`/search/listCollections`">Collections</Link>
          </li>
          <li
            v-for="(crumb, index) in ancestry"
            :key="crumb.id"
            class="flex items-center gap-1">
            <span aria-hidden="true">&rsaquo;</span>
            <Link
              v-if="index < ancestry.length - 1"
              :to="`/collections/browseCollection/${crumb.id}`">
              {{ crumb.title }}
            </Link>
            <span
              v-else
              aria-current="page"
              class="font-semibold text-on-surface">
              {{ crumb.title }}
            </span>
          </li>
        </ol>
      </nav>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h2 v-if="collection?.title" class="text-4xl font-bold">
          Browsing {{ collection?.title }}
        </h2>
        <Button
          v-if="collection && instanceStore.currentUser?.isAdmin"
          variant="secondary"
          class="whitespace-nowrap"
          :to="{
            name: 'adminPermissions',
            query: { collection: String(collection.id) },
          }">
          Manage Permissions
        </Button>
      </div>

      <SanitizedHTML
        v-if="collection?.description"
        :html="collection.description"
        class="prose max-w-screen-lg mt-2" />
      <template v-if="!collection">
        <Skeleton class="!w-1/2 !h-12 !my-8" />
      </template>
    </header>
  </div>
</template>
<script setup lang="ts">
import { watch, ref, computed } from "vue";
import { AssetCollection } from "@/types";
import { useInstanceStore } from "@/stores/instanceStore";
import { toCollectionAncestry } from "@/helpers/collectionHelpers";
import Button from "@/components/Button/Button.vue";
import Link from "@/components/Link/Link.vue";
import SanitizedHTML from "@/components/SanitizedHTML/SanitizedHTML.vue";
import Skeleton from "@/components/Skeleton/Skeleton.vue";

const props = defineProps<{
  collectionId: number;
}>();

const instanceStore = useInstanceStore();
const collection = ref<AssetCollection | null>(null);

const ancestry = computed((): AssetCollection[] =>
  toCollectionAncestry(instanceStore.collectionIndex, props.collectionId)
);

watch(
  [() => props.collectionId, () => instanceStore.isReady],
  async () => {
    if (!instanceStore.isReady) return;

    collection.value = await instanceStore.getCollectionById(
      props.collectionId
    );
  },
  { immediate: true }
);
</script>
<style scoped></style>
