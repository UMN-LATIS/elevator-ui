<template>
  <AdminLayout>
    <PageContent class="max-w-screen-lg">
      <PageHeader
        title="Collections"
        description="Organize this instance's assets into collections">
        <template #actions>
          <Button :to="{ name: 'listCollections' }">Browse Collections</Button>
          <Button :to="{ name: 'adminPermissions' }">Permissions</Button>
        </template>
      </PageHeader>

      <DataTable
        :itemName="{ singular: 'collection', plural: 'collections' }"
        :rows="collectionRows"
        :columns="collectionColumns"
        :status="status"
        :isRowDeleting="(row) => row.id === deletingId">
        <template #toolbarEnd>
          <Button variant="primary" :to="{ name: 'adminCollectionsCreate' }">
            Create Collection
          </Button>
        </template>
        <template #cell-title="{ row }">
          <RouterLink
            :to="`/collections/browseCollection/${row.id}`"
            class="text-sm font-medium text-primary underline-offset-2 hover:underline">
            {{ row.title }}
          </RouterLink>
        </template>
        <template #cell-parent="{ row }">
          <div class="text-sm text-on-surface-variant">
            {{ row.parentTitle }}
          </div>
        </template>
        <template #cell-showInBrowse="{ row }">
          <CheckIcon
            v-if="row.showInBrowse"
            class="size-4 text-primary"
            aria-label="Shown in browse" />
        </template>
        <template #cell-actions="{ row }">
          <div class="flex justify-end">
            <KebabMenu
              :label="`Actions for ${row.title}`"
              :items="collectionMenuItems(row)" />
          </div>
        </template>
      </DataTable>

      <ConfirmModal
        :isOpen="Boolean(collectionPendingDelete)"
        title="Delete Collection"
        type="danger"
        confirmLabel="Delete"
        @close="collectionPendingDelete = null"
        @confirm="confirmDelete">
        <p>
          Are you sure you want to delete
          <b>{{ collectionPendingDelete?.title }}?</b>
          <template v-if="collectionPendingDelete?.hasChildren">
            Its sub-collections will move to the top level.
          </template>
          This action cannot be undone.
        </p>
      </ConfirmModal>
    </PageContent>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import { CheckIcon, LockIcon, PencilIcon, TrashIcon } from "lucide-vue-next";
import { DataTable } from "@/components/DataTable";
import KebabMenu from "@/components/KebabMenu/KebabMenu.vue";
import type { KebabMenuItem } from "@/components/KebabMenu/KebabMenu.vue";
import AdminLayout from "@/layouts/AdminLayout.vue";
import PageContent from "@/components/PageContent/PageContent.vue";
import PageHeader from "@/components/PageHeader/PageHeader.vue";
import Button from "@/components/Button/Button.vue";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal.vue";
import { useToastStore } from "@/stores/toastStore";
import {
  adminCollectionsQuery,
  useDeleteCollectionMutation,
} from "../../queries/adminCollectionQueries";
import { buildCollectionRows } from "./buildCollectionRows";
import type { CollectionRow } from "./buildCollectionRows";
import type { DataTableColumn } from "@/types";

const router = useRouter();
const toastStore = useToastStore();

const { data: collections, status } = useQuery(adminCollectionsQuery());

const collectionRows = computed(() =>
  buildCollectionRows(collections.value ?? [])
);

function openEdit(collection: CollectionRow) {
  router.push({
    name: "adminCollectionsEdit",
    params: { id: collection.id },
  });
}

function openCollectionPermissions(collection: CollectionRow) {
  router.push({
    name: "adminPermissions",
    query: { collection: collection.id },
  });
}

const deleteCollectionMutation = useDeleteCollectionMutation();

// the collection being deleted
const deletingId = computed((): number | null => {
  if (!deleteCollectionMutation.isPending.value) return null;
  return deleteCollectionMutation.variables.value ?? null;
});

// doubles as the confirm modal's open state
const collectionPendingDelete = ref<CollectionRow | null>(null);

function askToDeleteCollection(collection: CollectionRow) {
  collectionPendingDelete.value = collection;
}

function confirmDelete() {
  const collection = collectionPendingDelete.value;
  if (!collection) return;
  deleteCollectionMutation.mutate(collection.id, {
    onSuccess: () =>
      toastStore.addToast({
        message: "Collection deleted.",
        variant: "success",
      }),
    onError: (error) =>
      toastStore.addToast({
        title: "Delete Collection Failed",
        message: `Failed to delete collection: ${error.message}`,
        variant: "error",
      }),
  });
  collectionPendingDelete.value = null;
}

function collectionMenuItems(collection: CollectionRow): KebabMenuItem[] {
  return [
    {
      label: "Edit",
      icon: PencilIcon,
      onSelect: () => openEdit(collection),
    },
    {
      label: "Permissions",
      icon: LockIcon,
      onSelect: () => openCollectionPermissions(collection),
    },
    {
      label: "Delete",
      icon: TrashIcon,
      variant: "danger",
      onSelect: () => askToDeleteCollection(collection),
    },
  ];
}

const collectionColumns: DataTableColumn<CollectionRow>[] = [
  {
    id: "title",
    label: "Collection",
    defaultSort: "asc",
    sortValue: (row) => row.title,
    searchValue: (row) => row.title,
  },
  {
    id: "parent",
    label: "Parent",
    width: "lg",
    sortValue: (row) => row.parentTitle,
    searchValue: (row) => row.parentTitle,
  },
  {
    id: "showInBrowse",
    label: "In Browse",
    width: "md",
    sortValue: (row) => row.showInBrowse,
  },
  { id: "actions", label: "Actions", isLabelHidden: true, width: "sm" },
];
</script>
