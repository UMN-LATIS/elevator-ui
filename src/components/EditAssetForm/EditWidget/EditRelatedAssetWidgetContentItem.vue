<template>
  <div class="flex items-center flex-wrap gap-4">
    <Combobox
      by="label"
      class="flex-1"
      :modelValue="modelValue.targetAssetId ?? ''"
      @update:modelValue="handleSelectItem($event as string | null)">
      <ComboboxAnchor asChild>
        <ComboboxTrigger class="w-full">
          <button
            type="button"
            class="w-full text-left flex items-center gap-4 justify-between pr-2 bg-black/5 p-2 hover:bg-black/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <EditRelatedAssetPreview
              v-if="targetAssetPreview"
              :assetPreview="targetAssetPreview"
              class="flex-1" />
            <span v-else-if="isTargetAssetPreviewLoading">
              <SpinnerIcon class="size-4 ml-2" />
              Loading...
            </span>
            <span v-else>Select an asset...</span>
            <ChevronDownIcon />
          </button>
        </ComboboxTrigger>
      </ComboboxAnchor>

      <ComboboxList
        class="focus-within:shadow-md focus-within:border-2 focus-within:border-blue-500 rounded-md overflow-hidden">
        <div class="relative w-full items-center">
          <ComboboxInput
            v-model="searchInput"
            class="pl-9"
            :displayValue="(val) => val?.label ?? ''"
            :placeholder="`Select ${widgetDef.label}...`" />
          <span
            class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
            <Search class="size-4 text-muted-foreground" />
          </span>
        </div>

        <ComboboxEmpty>
          <div v-if="isLoading || debouncedSearchInput !== searchInput">
            <div class="flex items-center justify-center gap-2">
              <SpinnerIcon class="size-4" />
              <span>Loading...</span>
            </div>
          </div>
          <div v-else-if="isSuccess && autocompleteOptions.length === 0">
            None found.
          </div>
        </ComboboxEmpty>

        <ComboboxItem
          v-for="option in autocompleteOptions"
          :key="option.value"
          :value="option.value">
          <EditRelatedAssetPreview
            :assetPreview="option.preview"
            class="flex-1" />
          <ComboboxItemIndicator>
            <Check :class="cn('ml-auto h-4 w-4')" />
          </ComboboxItemIndicator>
        </ComboboxItem>
      </ComboboxList>
    </Combobox>
  </div>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import { useSearchAssetsQuery } from "@/queries/useSearchAssetsQuery";
import { computed, ref } from "vue";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Check, ChevronDownIcon, Search } from "lucide-vue-next";
import { SpinnerIcon } from "@/icons";
import { useDebounce } from "@vueuse/core";
import { useAssetPreviewQuery } from "@/queries/useAssetPreviewQuery";
import EditRelatedAssetPreview from "./EditRelatedAssetPreview.vue";

const props = defineProps<{
  modelValue: Type.WithId<Type.RelatedAssetWidgetContent>;
  assetId: string | null; // need current assetId to prevent circular dependencies
  widgetDef: Type.RelatedAssetWidgetProps;
  widgetContents: Type.WithId<Type.RelatedAssetWidgetContent>[]; // need all widget content to prevent multiple lines to the same asset within the widget
}>();

const emit = defineEmits<{
  (
    e: "update:modelValue",
    widgetContentItem: Type.WithId<Type.RelatedAssetWidgetContent>
  ): void;
}>();

const searchInput = ref("");
const debouncedSearchInput = useDebounce(searchInput, 300);

const {
  data: matches,
  isLoading,
  isSuccess,
} = useSearchAssetsQuery(debouncedSearchInput);

const targetAssetId = computed(() => props.modelValue.targetAssetId);

const { data: targetAssetPreview, isLoading: isTargetAssetPreviewLoading } =
  useAssetPreviewQuery(targetAssetId);

const otherSelectedAssetIds = computed(() =>
  props.widgetContents.map((item) => item.targetAssetId)
);

const autocompleteOptions = computed(() => {
  if (!matches.value) {
    return [];
  }
  const ignoredAssetIds = [
    props.assetId,
    ...otherSelectedAssetIds.value,
    targetAssetId.value,
  ].filter(Boolean);

  return (
    matches.value
      .filter((match) => !ignoredAssetIds.includes(match.objectId))
      .map((match) => ({
        value: match.objectId,
        label: match.title,
        preview: match,
      })) ?? []
  );
});

function handleSelectItem(targetAssetId: string | null) {
  emit("update:modelValue", {
    ...props.modelValue,
    targetAssetId,
  });
}
</script>
<style scoped></style>
<style></style>
