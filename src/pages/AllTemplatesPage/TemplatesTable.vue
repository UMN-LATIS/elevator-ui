<template>
  <DataTable
    :itemName="{ singular: 'template', plural: 'templates' }"
    :rows="templates"
    :columns="columns"
    :status="status">
    <template #toolbarEnd>
      <Button variant="primary" to="/templates/edit">Create Template</Button>
    </template>
    <template #cell-id="{ row: template }">
      <div class="text-sm">{{ template.id }}</div>
    </template>
    <template #cell-name="{ row: template }">
      <Link
        class="text-sm"
        :to="{ name: 'templatesEdit', params: { id: template.id } }">
        {{ template.name }}
      </Link>
    </template>
    <template #cell-createdAt="{ row: template }">
      <div class="text-sm">{{ toDateLabel(template.createdAt) }}</div>
    </template>
    <template #cell-modifiedAt="{ row: template }">
      <div class="text-sm">{{ toDateLabel(template.modifiedAt) }}</div>
    </template>
    <template #cell-actions="{ row: template }">
      <div class="flex items-center justify-end">
        <KebabMenu
          :label="`Actions for ${template.name}`"
          :items="templateMenuItems(template)" />
      </div>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useMediaQuery } from "@vueuse/core";
import type { QueryStatus } from "@tanstack/vue-query";
import {
  CopyPlusIcon,
  PencilIcon,
  RefreshCcwDotIcon,
  Trash2,
} from "lucide-vue-next";
import Button from "@/components/Button/Button.vue";
import { DataTable } from "@/components/DataTable";
import KebabMenu from "@/components/KebabMenu/KebabMenu.vue";
import type { KebabMenuItem } from "@/components/KebabMenu/KebabMenu.vue";
import Link from "@/components/Link/Link.vue";
import type { DataTableColumn, TemplateSummary } from "@/types";

defineProps<{
  templates: TemplateSummary[];
  status: QueryStatus;
}>();

const emit = defineEmits<{
  edit: [template: TemplateSummary];
  duplicate: [template: TemplateSummary];
  reindex: [template: TemplateSummary];
  delete: [template: TemplateSummary];
}>();

const isMdScreen = useMediaQuery("(min-width: 768px)");

const columns = computed((): DataTableColumn<TemplateSummary>[] => [
  {
    id: "id",
    label: "ID",
    width: "sm",
    sortValue: (template) => template.id,
    searchValue: (template) => template.id,
  },
  {
    id: "name",
    label: "Name",
    defaultSort: "asc",
    sortValue: (template) => template.name,
    searchValue: (template) => template.name,
  },
  {
    id: "createdAt",
    label: "Created",
    width: "md",
    isHidden: !isMdScreen.value,
    sortValue: (template) => template.createdAt,
  },
  {
    id: "modifiedAt",
    label: "Modified",
    width: "md",
    isHidden: !isMdScreen.value,
    sortValue: (template) => template.modifiedAt,
  },
  { id: "actions", label: "Actions", isLabelHidden: true, width: "sm" },
]);

function toDateLabel(value: string | undefined): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function templateMenuItems(template: TemplateSummary): KebabMenuItem[] {
  return [
    {
      label: "Edit",
      icon: PencilIcon,
      onSelect: () => emit("edit", template),
    },
    {
      label: "Duplicate",
      icon: CopyPlusIcon,
      onSelect: () => emit("duplicate", template),
    },
    {
      label: "Reindex",
      icon: RefreshCcwDotIcon,
      onSelect: () => emit("reindex", template),
    },
    {
      label: "Delete",
      icon: Trash2,
      variant: "danger",
      onSelect: () => emit("delete", template),
    },
  ];
}
</script>
