<template>
  <div class="overflow-hidden">
    <div v-if="!templateId" class="text-red-500">
      No template selected for this related asset widget. Please set
      <code class="font-mono bg-black/5">defaultTemplate</code>
      in the widget definition.
    </div>
    <InlineCreateOrEditAssetPage
      v-else
      :key="modelValue.id"
      :templateId="templateId"
      :collectionId="props.collectionId"
      :assetId="modelValue.targetAssetId"
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
import { computed } from "vue";
import { useAssetEditor } from "../../useAssetEditor/useAssetEditor";
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

const templateId = computed((): Type.Template["templateId"] | null => {
  return props.widgetDef.fieldData.defaultTemplate ?? null;
});

const parentAssetEditor = useAssetEditor();

function handleUpdateRelatedAssetDirty(isDirty: boolean) {
  // emit the dirty state to the parent component
  parentAssetEditor?.updateModifiedInlineRelatedAsset(
    props.modelValue.id,
    isDirty
  );
}
</script>
