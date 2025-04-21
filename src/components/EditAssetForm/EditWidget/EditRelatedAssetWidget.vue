<template>
  <EditWidgetLayout
    :widgetContents="widgetContents"
    :widgetDef="widgetDef"
    class="edit-relatedasset-widget"
    @add="
      $emit(
        'update:widgetContents',
        ops.makeAddContentPayload(widgetContents, widgetDef)
      )
    "
    @setPrimary="
      (id) =>
        $emit(
          'update:widgetContents',
          ops.makeSetPrimaryContentPayload(widgetContents, id)
        )
    "
    @delete="
      (id) =>
        $emit(
          'update:widgetContents',
          ops.deleteWidgetContent(widgetContents, id)
        )
    "
    @update:widgetContents="
      (widgetContents) => {
        $emit('update:widgetContents', widgetContents);
      }
    ">
    <template #fieldContents="{ item }">
      <div class="flex flex-col gap-4">
        <Combobox
          by="label"
          :modelValue="item.targetAssetId"
          @update:modelValue="handleUpdateTargetAsset(item, $event as string)">
          <ComboboxAnchor asChild>
            <ComboboxTrigger asChild>
              <Button>
                {{ item.targetAssetId ?? "Select an asset" }}
              </Button>
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
                {{ option.label }}

                <ComboboxItemIndicator>
                  <Check :class="cn('ml-auto h-4 w-4')" />
                </ComboboxItemIndicator>
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
        </Combobox>
      </div>
    </template>
  </EditWidgetLayout>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import EditWidgetLayout from "./EditWidgetLayout.vue";
import * as ops from "../editWidgetOps";
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
import { Check, Search } from "lucide-vue-next";
import { SpinnerIcon } from "@/icons";
import { useDebounce } from "@vueuse/core";
import Button from "@/components/Button/Button.vue";

const props = defineProps<{
  widgetDef: Type.RelatedAssetWidgetProps;
  widgetContents: Type.WithId<Type.RelatedAssetWidgetContent>[];
}>();

const emit = defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.RelatedAssetWidgetContent>[]
  ): void;
}>();

const searchInput = ref("");
const debouncedSearchInput = useDebounce(searchInput, 300);

const {
  data: matches,
  isLoading,
  isSuccess,
} = useSearchAssetsQuery(debouncedSearchInput);

const autocompleteOptions = computed(() => {
  return (
    matches.value?.map((match) => ({
      value: match.objectId,
      label: match.title,
    })) ?? []
  );
});

const handleUpdateTargetAsset = (item, updatedTargetAssetId: string) => {
  if (typeof updatedTargetAssetId !== "string") {
    throw new Error(
      `Updated target asset ID must be a string: ${updatedTargetAssetId}`
    );
  }

  emit(
    "update:widgetContents",
    ops.makeUpdateContentPayload(props.widgetContents, item.id, {
      ...item,
      targetAssetId: updatedTargetAssetId,
    })
  );
};
</script>
<style scoped></style>
<style></style>
