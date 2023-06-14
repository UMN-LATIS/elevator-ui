<template>
  <BaseFilterRow
    label="File Type"
    :rowIndex="rowIndex"
    @remove="searchStore.removeFileTypeFilter"
  >
    <select
      v-if="searchStore.filterBy.globalFileType"
      v-model="searchStore.filterBy.globalFileType.fileType"
      class="rounded-md w-full text-sm"
    >
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
    label: "All",
    value: "",
  },
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
<style scoped>
select {
  background-image: url("data:image/svg+xml, %3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%23111' %3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
  padding-right: 2.5rem;
  border-color: #e5e5e5;
}
</style>
