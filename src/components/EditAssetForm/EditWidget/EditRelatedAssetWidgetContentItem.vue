<template>
  <div class="flex flex-col gap-2">
    <InputGroup
      label="Label"
      :modelValue="modelValue.label ?? ''"
      placeholder="Label"
      :labelHidden="true"
      @update:modelValue="
        (label) =>
          $emit('update:modelValue', {
            ...modelValue,
            label: label ? label.toString() : null,
          })
      " />
    <div :class="['grid grid-cols-[1fr,auto] gap-2']">
      <Combobox
        by="label"
        :modelValue="modelValue.targetAssetId ?? ''"
        @update:modelValue="handleSelectItem($event as string | null)">
        <ComboboxAnchor asChild>
          <ComboboxTrigger
            class="w-full bg-black/5 h-full text-left flex items-center gap-4 justify-between px-4 py-3 hover:bg-black/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-sm">
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
      <div v-if="modelValue.targetAssetId" class="flex flex-col gap-1">
        <Tooltip tip="Clear related asset">
          <Button
            variant="tertiary"
            @click="
              $emit('update:modelValue', {
                ...modelValue,
                targetAssetId: null,
              })
            ">
            <span class="sr-only">Clear</span>
            <CircleXIcon class="size-4" />
          </Button>
        </Tooltip>
        <Tooltip tip="View related asset">
          <Button
            variant="tertiary"
            :to="`/asset/viewAsset/${modelValue.targetAssetId}`"
            target="_blank">
            <span class="sr-only">View</span>
            <ArrowRightIcon class="size-4" />
          </Button>
        </Tooltip>
        <Tooltip tip="Edit related asset">
          <Button
            variant="tertiary"
            :to="`/assetManager/editAsset/${modelValue.targetAssetId}`"
            target="_blank">
            <span class="sr-only">Edit</span>
            <PencilIcon class="size-4" />
          </Button>
        </Tooltip>
      </div>
      <Button
        v-if="!modelValue.targetAssetId"
        class="text-sm px-3 py-2"
        @click="openCreateNewAssetWindow()">
        Create New
      </Button>
    </div>
  </div>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import { useSearchAssetsQuery } from "@/queries/useSearchAssetsQuery";
import { computed, onMounted, ref } from "vue";
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
import InputGroup from "@/components/InputGroup/InputGroup.vue";
import {
  ArrowRightIcon,
  Check,
  ChevronDownIcon,
  CircleXIcon,
  PencilIcon,
  Search,
} from "lucide-vue-next";
import { SpinnerIcon } from "@/icons";
import { useDebounce } from "@vueuse/core";
import { useAssetPreviewQuery } from "@/queries/useAssetPreviewQuery";
import EditRelatedAssetPreview from "./EditRelatedAssetPreview.vue";
import Button from "@/components/Button/Button.vue";
import Tooltip from "@/components/Tooltip/Tooltip.vue";
import { useRelatedAssetChannel } from "@/composables/useRelatedAssetChannel";

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
const createNewAssetUrl = computed(() => {
  const channelName = getChannelName(props.assetId, props.modelValue.id);
  const params = new URLSearchParams({
    // parentAssetId: props.assetId ?? "",
    // relatedAssetContentId: props.modelValue.id,
    channelName,
  });
  return `/assetManager/addAsset?${params.toString()}`;
});

// use window.open for opening new related asset so that
// the new tab has window.opener set to the current window
const openCreateNewAssetWindow = () =>
  window.open(createNewAssetUrl.value, "_blank");

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

//  set up a listener if the user decides to create a new asset
const { getChannelName, listenForRelatedAsset } = useRelatedAssetChannel();
onMounted(() => {
  listenForRelatedAsset(props.assetId, props.modelValue.id, (newAssetId) => {
    emit("update:modelValue", {
      ...props.modelValue,
      targetAssetId: newAssetId,
    });
  });
});
</script>
<style scoped></style>
<style></style>
