<template>
  <BaseFilterRow
    label="File Type"
    :rowIndex="rowIndex"
    @remove="searchStore.removeFileTypeFilter">
    <select
      v-if="searchStore.filterBy.globalFileType"
      v-model="searchStore.filterBy.globalFileType.fileType"
      aria-label="File type"
      class="themed-select">
      <option value="">All</option>
      <option v-for="opt in sortedOptions" :key="opt.label" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </BaseFilterRow>
</template>
<script setup lang="ts">
import { GlobalSearchableFileType } from "@/types";
import BaseFilterRow from "./BaseFilterRow.vue";
import { useSearchStore } from "@/stores/searchStore";

defineProps<{
  rowIndex: number;
}>();

const searchStore = useSearchStore();

interface FileTypeOption {
  label: string;
  value: GlobalSearchableFileType;
}

const fileTypeOptions: FileTypeOption[] = [
  {
    label: "Image",
    value: "image",
  },
  {
    label: "Video",
    value: "movie",
  },
  {
    label: "Audio",
    value: "audio",
  },
  {
    label: "Doc",
    value: "office",
  },
  {
    label: "TXT",
    value: "txt",
  },
  {
    label: "PDF",
    value: "pdf",
  },
  {
    label: "PPT",
    value: "office",
  },
  {
    label: "3D (obj)",
    value: "zipobj",
  },
  {
    label: "3D (ply)",
    value: "ply",
  },
  {
    label: "DICOM",
    value: "zipmeddicom",
  },
  {
    label: "SCORM",
    value: "zipscorm",
  },
];

const sortedOptions = [...fileTypeOptions].sort((a, b) =>
  a.label.localeCompare(b.label)
) as FileTypeOption[];
</script>
