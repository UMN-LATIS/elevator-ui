<template>
  <div>
    <div v-if="!templateId" class="text-red-500">
      No template selected for this related asset widget. Please set
      <code class="font-mono bg-black/5">defaultTemplate</code>
      in the widget definition.
    </div>
    <iframe
      v-else
      ref="iframeRef"
      :src="`/assetManager/addAsset/${templateId}/${collectionId}/true`"
      class="w-full h-full"
      frameborder="0"
      @load="handleIframeLoad" />
  </div>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import { computed, useTemplateRef } from "vue";

const props = defineProps<{
  collectionId: Type.AssetCollection["id"];
  modelValue: Type.WithId<Type.RelatedAssetWidgetContent>;
  assetId: string | null; // need current assetId to prevent circular dependencies
  widgetDef: Type.RelatedAssetWidgetDef;
  widgetContents: Type.WithId<Type.RelatedAssetWidgetContent>[]; // need all widget content to prevent multiple lines to the same asset within the widget
}>();

const iframeRef = useTemplateRef<HTMLIFrameElement>("iframeRef");

const templateId = computed((): Type.Template["templateId"] | null => {
  return props.widgetDef.fieldData.defaultTemplate ?? null;
});

function handleIframeLoad() {
  // This function can be used to handle any actions after the iframe loads
  // For example, you might want to focus on the iframe or log a message
  console.log("Iframe loaded successfully");

  // adjust the container height to fit the iframe content
  console.log(iframeRef.value);
}
</script>
