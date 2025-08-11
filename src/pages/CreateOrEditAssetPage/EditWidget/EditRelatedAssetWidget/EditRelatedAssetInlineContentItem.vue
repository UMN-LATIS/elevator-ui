<template>
  <div class="overflow-hidden">
    <div v-if="!templateId" class="text-red-500">
      No template selected for this related asset widget. Please set
      <code class="font-mono bg-black/5">defaultTemplate</code>
      in the widget definition.
    </div>
    <InlineCreateOrEditAssetPage
      v-else
      :templateId="templateId"
      :collectionId="props.collectionId"
      :assetId="modelValue.targetAssetId"
      :parentAssetEditor="parentAssetEditor"
      class="w-full h-full"
      @update:assetId="
        $emit('update:modelValue', {
          ...modelValue,
          targetAssetId: $event,
        })
      "
      @update:relatedAssetDirty="handleUpdateRelatedAssetDirty" />
  </div>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import { computed, inject } from "vue";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/constants/constants";
import InlineCreateOrEditAssetPage from "../../InlineCreateOrEditAssetPage.vue";

const props = defineProps<{
  collectionId: Type.AssetCollection["id"];
  modelValue: Type.WithId<Type.RelatedAssetWidgetContent>;
  widgetDef: Type.RelatedAssetWidgetDef;
  assetId: string | null; // need current assetId to prevent circular dependencies
}>();

defineEmits<{
  (
    e: "update:modelValue",
    modelValue: Type.WithId<Type.RelatedAssetWidgetContent>
  ): void;
}>();

// TODO: fix these props changing which is triggering rerender.
console.log("EditRelatedAssetInlineContentItem props:", props);

const parentAssetEditor = inject(ASSET_EDITOR_PROVIDE_KEY);

const templateId = computed((): Type.Template["templateId"] | null => {
  return props.widgetDef.fieldData.defaultTemplate ?? null;
});

function handleUpdateRelatedAssetDirty(isDirty: boolean) {
  // emit the dirty state to the parent component
  parentAssetEditor?.updateModifiedInlineRelatedAsset(
    props.modelValue.id,
    isDirty
  );
}
</script>
