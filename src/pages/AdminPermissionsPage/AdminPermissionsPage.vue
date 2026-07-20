<template>
  <AdminLayout>
    <PageContent class="max-w-screen-lg">
      <PageHeader
        :title="pageTitle"
        :eyebrow="pageEyebrow"
        description="Grant access to any collection in this instance" />
      <PermissionsTable />
    </PageContent>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AdminLayout from "@/layouts/AdminLayout.vue";
import PageContent from "@/components/PageContent/PageContent.vue";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import { useInstanceQuery } from "@/queries/useInstanceQuery";
import {
  flattenCollections,
  normalizeAssetCollections,
} from "@/helpers/collectionHelpers";
import PermissionsTable from "./PermissionsTable.vue";
import { useCollectionFilter } from "./useCollectionFilter";

const { collectionFilterId } = useCollectionFilter();
const { data: instanceNav } = useInstanceQuery();

// flattenCollections builds nested titles as "Parent › Child"
const COLLECTION_PATH_SEPARATOR = " › ";

// the filtered collection's title as path segments, ["Parent", "Leaf"],
// or [] when unfiltered
const filteredCollectionPath = computed((): string[] => {
  const collectionId = collectionFilterId.value;
  if (collectionId === null) return [];

  const flat = flattenCollections(
    normalizeAssetCollections(instanceNav.value?.collections ?? [])
  );
  const breadcrumbTitle = flat.find(
    (collection) => collection.id === collectionId
  )?.title;
  return breadcrumbTitle
    ? breadcrumbTitle.split(COLLECTION_PATH_SEPARATOR)
    : [];
});

// only the leaf collection in the page title
const pageTitle = computed((): string => {
  const path = filteredCollectionPath.value;
  if (path.length === 0) return "Permissions";
  return `${path[path.length - 1]} Permissions`;
});

// any ancestor collections go in the eyebrow
const pageEyebrow = computed((): string | undefined => {
  const ancestors = filteredCollectionPath.value.slice(0, -1);
  if (ancestors.length === 0) return undefined;
  return ancestors.join(COLLECTION_PATH_SEPARATOR);
});
</script>
