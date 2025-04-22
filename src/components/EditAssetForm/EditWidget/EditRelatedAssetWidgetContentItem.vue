<template>
  <div class="flex items-center flex-wrap gap-4 bg-black/5 p-2 rounded-md">
    <Combobox
      by="label"
      class="flex-1"
      :modelValue="modelValue.targetAssetId ?? ''"
      @update:modelValue="
        $emit('update:modelValue', {
          ...modelValue,
          targetAssetId: $event as string | null,
        })
      ">
      <ComboboxAnchor asChild>
        <ComboboxTrigger asChild>
          <button type="button" class="w-full text-left">
            <EditRelatedAssetPreview
              v-if="targetAssetPreview"
              :assetPreview="targetAssetPreview"
              class="flex-1" />
          </button>
          <!-- <Button class="border-non">
              <span v-if="targetAssetId">Edit</span>
              <span v-else>Search for an asset...</span>
            </Button> -->
        </ComboboxTrigger>
      </ComboboxAnchor>

      <ComboboxList>
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
          <div v-else-if="searchInput.length < 2">
            Type at least 2 characters to search
          </div>
          <div v-else-if="isSuccess && autocompleteOptions.length === 0">
            None found.
          </div>
        </ComboboxEmpty>

        <ComboboxGroup>
          <ComboboxItem
            v-for="option in autocompleteOptions"
            :key="option.value"
            :value="option.value">
            <div class="flex flex-col">
              <p>{{ option.label }}</p>
              <small class="text-neutral-400">{{ option.value }}</small>
            </div>
            <ComboboxItemIndicator>
              <Check :class="cn('ml-auto h-4 w-4')" />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxList>
    </Combobox>
    <Button
      v-if="targetAssetId"
      variant="tertiary"
      :to="getAssetUrl(targetAssetId)"
      target="_blank">
      View
      <ExternalLinkIcon class="size-4" />
    </Button>
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
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Check, ExternalLink, ExternalLinkIcon, Search } from "lucide-vue-next";
import { SpinnerIcon } from "@/icons";
import { useDebounce } from "@vueuse/core";
import Button from "@/components/Button/Button.vue";
import { useAssetPreviewQuery } from "@/queries/useAssetPreviewQuery";
import {
  getThumbURL,
  convertHtmlToText,
  getAssetUrl,
} from "@/helpers/displayUtils";
import EditRelatedAssetPreview from "./EditRelatedAssetPreview.vue";

const props = defineProps<{
  widgetDef: Type.RelatedAssetWidgetProps;
  modelValue: Type.WithId<Type.RelatedAssetWidgetContent>;
}>();

defineEmits<{
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

const autocompleteOptions = computed(() => {
  return (
    matches.value?.map((match) => ({
      value: match.objectId,
      label: match.title,
    })) ?? []
  );
});

const title = computed(() => {
  if (isTargetAssetPreviewLoading.value) {
    return "";
  }

  if (!targetAssetPreview.value) {
    return props.modelValue.targetAssetId;
  }

  if (Array.isArray(targetAssetPreview.value.title)) {
    return targetAssetPreview.value.title.map(convertHtmlToText).join(",");
  }

  if (
    targetAssetPreview.value.title &&
    targetAssetPreview.value.title.length > 0
  ) {
    return convertHtmlToText(targetAssetPreview.value.title);
  }

  return props.modelValue.targetAssetId;
});

const imgSrc = computed(() => {
  if (!targetAssetPreview.value) {
    return null;
  }
  const { primaryHandlerId } = targetAssetPreview.value;
  return primaryHandlerId ? getThumbURL(primaryHandlerId) : null;
});
</script>
<style scoped></style>
<style></style>
