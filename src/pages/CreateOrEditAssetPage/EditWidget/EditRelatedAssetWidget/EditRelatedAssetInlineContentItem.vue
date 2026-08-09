<template>
  <div class="overflow-hidden">
    <div v-if="!templateId" class="text-error">
      No template selected for this related asset widget. Please set
      <code class="font-mono bg-surface-container-lowest">defaultTemplate</code>
      in the widget definition.
    </div>
    <InlineCreateOrEditAssetPage
      v-else
      :key="modelValue.uuid"
      :templateId="templateId"
      :collectionId="props.collectionId"
      :assetId="modelValue.targetAssetId"
      :fieldTitle="widgetDef.fieldTitle"
      :itemUuid="modelValue.uuid"
      class="w-full h-full" />
  </div>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import { computed } from "vue";
import InlineCreateOrEditAssetPage from "../../InlineCreateOrEditAssetPage.vue";

const props = defineProps<{
  collectionId: Type.AssetCollection["id"];
  modelValue: Type.WithUuid<Type.RelatedAssetWidgetContent>;
  widgetDef: Type.RelatedAssetWidgetDef;
  assetId: string | null; // need current assetId to prevent circular dependencies
}>();

const templateId = computed((): Type.Template["templateId"] | null => {
  return props.widgetDef.fieldData.defaultTemplate ?? null;
});
</script>
