<template>
  <DataTable
    :itemName="{ singular: 'page', plural: 'pages' }"
    :rows="pages"
    :columns="columns"
    :status="status">
    <template #toolbarEnd>
      <Button variant="primary" :to="{ name: 'createCustomPage' }">
        Create Page
      </Button>
    </template>
    <template #cell-title="{ row: page }">
      <RouterLink
        :to="`/page/view/${page.id}`"
        class="text-link hover:underline">
        {{ page.title }}
      </RouterLink>
    </template>
    <template #cell-body="{ row: page }">
      <div
        class="max-w-md text-sm text-muted-foreground"
        :title="plainTextOf(page.body)">
        {{ excerptOf(page.body) }}
      </div>
    </template>
    <template #cell-parentTitle="{ row: page }">
      <RouterLink
        v-if="page.parentTitle && page.parentId"
        :to="`/page/view/${page.parentId}`"
        class="text-link hover:underline">
        {{ page.parentTitle }}
      </RouterLink>
      <div v-else class="text-muted-foreground">—</div>
    </template>
    <template #cell-includeInHeader="{ row: page }">
      <div class="flex items-center justify-center w-full">
        <CircleCheck
          v-if="page.includeInHeader"
          class="text-green-500"
          :size="16"
          :strokeWidth="2" />
      </div>
    </template>
    <template #cell-createdAt="{ row: page }">
      <div class="text-sm text-muted-foreground">
        {{ toDateLabel(page.createdAt) }}
      </div>
    </template>
    <template #cell-modifiedAt="{ row: page }">
      <div class="text-sm text-muted-foreground">
        {{ toDateLabel(page.modifiedAt) }}
      </div>
    </template>
    <template #cell-actions="{ row: page }">
      <div class="flex gap-2 items-center justify-center">
        <IconButton
          :to="{ name: 'editCustomPage', params: { pageId: page.id } }"
          :showTooltip="false"
          title="Edit">
          <PencilIcon class="size-4" />
        </IconButton>
        <IconButton
          class="enabled:text-error enabled:hover:bg-error-container enabled:hover:text-on-error-container"
          :showTooltip="false"
          title="Delete"
          @click="emit('delete', page.id)">
          <Trash2 class="size-4" />
        </IconButton>
      </div>
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useMediaQuery } from "@vueuse/core";
import type { QueryStatus } from "@tanstack/vue-query";
import { CircleCheck, PencilIcon, Trash2 } from "lucide-vue-next";
import Button from "@/components/Button/Button.vue";
import { DataTable } from "@/components/DataTable";
import IconButton from "@/components/IconButton/IconButton.vue";
import type { CustomPageSummary, DataTableColumn } from "@/types";

const BODY_EXCERPT_LENGTH = 100;

defineProps<{
  pages: CustomPageSummary[];
  status: QueryStatus;
}>();

const emit = defineEmits<{
  delete: [pageId: number];
}>();

const isSmScreen = useMediaQuery("(min-width: 640px)");
const isLgScreen = useMediaQuery("(min-width: 1024px)");

const columns = computed((): DataTableColumn<CustomPageSummary>[] => [
  {
    id: "title",
    label: "Title",
    defaultSort: "asc",
    sortValue: (page) => page.title,
    searchValue: (page) => page.title,
  },
  {
    id: "body",
    label: "Body",
    isHidden: !isLgScreen.value,
    searchValue: (page) => plainTextOf(page.body),
  },
  {
    id: "parentTitle",
    label: "Parent Page",
    width: "md",
    isHidden: !isSmScreen.value,
    sortValue: (page) => page.parentTitle,
    searchValue: (page) => page.parentTitle,
  },
  {
    id: "includeInHeader",
    label: "Menu",
    width: "sm",
    align: "center",
    isHidden: !isSmScreen.value,
  },
  {
    id: "createdAt",
    label: "Created",
    width: "md",
    isHidden: !isLgScreen.value,
    sortValue: (page) => page.createdAt,
  },
  {
    id: "modifiedAt",
    label: "Modified",
    width: "md",
    isHidden: !isLgScreen.value,
    sortValue: (page) => page.modifiedAt,
  },
  { id: "actions", label: "Actions", width: "sm", align: "center" },
]);

function plainTextOf(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function excerptOf(html: string): string {
  const plainText = plainTextOf(html);
  if (plainText.length <= BODY_EXCERPT_LENGTH) return plainText;
  return plainText.slice(0, BODY_EXCERPT_LENGTH) + "…";
}

function toDateLabel(value: string | undefined): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}
</script>
