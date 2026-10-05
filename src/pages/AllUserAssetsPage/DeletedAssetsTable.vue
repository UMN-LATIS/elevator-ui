<template>
  <DataTable :itemName="ITEM_NAME" :rows="assetRows" :columns="columns">
    <template #cell-objectId="{ row: asset }">
      &hellip;{{ asset.objectId.slice(-8) }}
    </template>
    <template #cell-title="{ row: asset }">
      {{ asset.title }}
    </template>
    <template #cell-deletedAt="{ row: asset }">
      {{ new Date(asset.deletedAt).toLocaleString() }}
    </template>
    <template #cell-actions="{ row: asset }">
      <Button
        variant="tertiary"
        :disabled="asset.pending"
        :class="{ 'opacity-50': asset.pending }"
        @click="emit('restore', asset.objectId)">
        <RotateCcw class="size-4" />
        {{ asset.pending ? "Pending..." : "Restore" }}
      </Button>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RotateCcw } from "lucide-vue-next";
import { DataTable } from "@/components/DataTable";
import Button from "@/components/Button/Button.vue";
import type { DataTableColumn, DeletedAssetSummary } from "@/types";

type DeletedAsset = DeletedAssetSummary & { pending?: boolean };
type DeletedAssetRow = DeletedAsset & { id: string };

const ITEM_NAME = { singular: "deleted asset", plural: "deleted assets" };

const props = defineProps<{
  assets: DeletedAsset[];
}>();

const emit = defineEmits<{
  restore: [objectId: string];
}>();

const assetRows = computed((): DeletedAssetRow[] =>
  props.assets.map((asset) => ({ ...asset, id: asset.objectId }))
);

const columns: DataTableColumn<DeletedAssetRow>[] = [
  {
    id: "objectId",
    label: "ID",
    width: "md",
    sortValue: (asset) => asset.objectId,
    searchValue: (asset) => asset.objectId,
  },
  {
    id: "title",
    label: "Title",
    sortValue: (asset) => asset.title,
    searchValue: (asset) => asset.title,
  },
  {
    id: "deletedAt",
    label: "Deleted At",
    defaultSort: "desc",
    width: "lg",
    sortValue: (asset) => asset.deletedAt,
  },
  { id: "actions", label: "Actions", width: "md" },
];
</script>
