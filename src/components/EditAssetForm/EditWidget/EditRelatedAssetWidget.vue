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
        <!-- <p>{{ item }}</p> -->
        {{ autocompleteOptions }}
        <Combobox
          by="label"
          :modelValue="item.targetAssetId"
          @update:modelValue="console.log('update:modelValue', $event)">
          <ComboboxAnchor>
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
              <span
                class="absolute end-0 inset-y-0 flex items-center justify-center px-3">
                <SpinnerIcon v-if="isLoading" class="size-4" />
              </span>
            </div>
          </ComboboxAnchor>

          <ComboboxList>
            <ComboboxEmpty>
              <div v-if="isLoading" class="flex items-center gap-2">
                <SpinnerIcon class="size-4" />
                <span>Loading...</span>
              </div>
              <div v-else>None found.</div>
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
} from "@/components/ui/combobox";
import { Check, Search } from "lucide-vue-next";
import { SpinnerIcon } from "@/icons";
import { useDebounce } from "@vueuse/core";

defineProps<{
  widgetDef: Type.RelatedAssetWidgetProps;
  widgetContents: Type.WithId<Type.RelatedAssetWidgetContent>[];
}>();

defineEmits<{
  (
    e: "update:widgetContents",
    widgetContents: Type.WithId<Type.RelatedAssetWidgetContent>[]
  ): void;
}>();
const searchInput = ref("");
const debouncedSearchInput = useDebounce(searchInput, 300);

const { data: matches, isLoading } = useSearchAssetsQuery(debouncedSearchInput);

const autocompleteOptions = computed(() => {
  return (
    matches.value?.map((match) => {
      console.log(match);
      return {
        value: match.objectId,
        label: match.title,
      };
    }) ?? null
  );
});
</script>
<style scoped></style>
<style></style>
