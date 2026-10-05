<template>
  <DataTable :itemName="ITEM_NAME" :rows="assetRows" :columns="columns">
    <template #cell-readyForDisplay="{ row: asset }">
      <div class="flex items-center justify-center">
        <CircleCheck
          v-if="asset.readyForDisplay"
          class="text-green-500"
          :size="16"
          :strokeWidth="2" />
      </div>
    </template>
    <template #cell-objectId="{ row: asset }">
      <TooltipProvider :delayDuration="300">
        <Tooltip>
          <TooltipTrigger>
            <RouterLink :to="`/assetManager/editAsset/${asset.objectId}`">
              &hellip;{{ asset.objectId.slice(-8) }}
            </RouterLink>
          </TooltipTrigger>
          <TooltipContent>{{ asset.objectId }}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </template>
    <template #cell-title="{ row: asset }">
      {{ asset.title }}
    </template>
    <template #cell-modifiedDate="{ row: asset }">
      {{ new Date(asset.modifiedDate.date).toLocaleString() }}
    </template>
    <template #cell-actions="{ row: asset }">
      <div class="flex gap-2">
        <RouterLink :to="`/assetManager/editAsset/${asset.objectId}`" asChild>
          <Button variant="tertiary">
            <PencilIcon class="size-4" />
            <span class="sr-only">Edit</span>
          </Button>
        </RouterLink>
        <Button
          variant="tertiary"
          class="hover:!bg-red-50 !text-red-400 hover:!text-red-500"
          @click="emit('delete', asset.objectId)">
          <TrashIcon class="size-4" />
          <span class="sr-only">Delete</span>
        </Button>
      </div>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CircleCheck, PencilIcon, TrashIcon } from "lucide-vue-next";
import { DataTable } from "@/components/DataTable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Button from "@/components/Button/Button.vue";
import type { AssetSummary, DataTableColumn } from "@/types";

type AssetRow = AssetSummary & { id: string };

const ITEM_NAME = { singular: "asset", plural: "assets" };

const props = defineProps<{
  assets: AssetSummary[];
}>();

const emit = defineEmits<{
  delete: [objectId: string];
}>();

const assetRows = computed((): AssetRow[] =>
  props.assets.map((asset) => ({ ...asset, id: asset.objectId }))
);

const columns: DataTableColumn<AssetRow>[] = [
  {
    id: "readyForDisplay",
    label: "Ready",
    width: "sm",
    align: "center",
    sortValue: (asset) => asset.readyForDisplay,
  },
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
    id: "modifiedDate",
    label: "Modified At",
    defaultSort: "desc",
    width: "lg",
    sortValue: (asset) => asset.modifiedDate.date,
  },
  { id: "actions", label: "Actions", width: "sm" },
];
</script>
