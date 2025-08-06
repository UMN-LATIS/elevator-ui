<template>
  <div class="overflow-hidden">
    <div v-if="!templateId" class="text-red-500">
      No template selected for this related asset widget. Please set
      <code class="font-mono bg-black/5">defaultTemplate</code>
      in the widget definition.
    </div>
    <iframe
      v-else
      ref="iframeRef"
      :src="`/assetManager/addAsset/${templateId}/${collectionId}/true`"
      class="w-full border-0"
      frameborder="0"
      :height="iframeHeight || 500" />
  </div>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import invariant from "tiny-invariant";
import { computed, useTemplateRef, ref, onMounted } from "vue";
import * as Penpal from "penpal";

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

const iframeHeight = ref<number>(500);

onMounted(async () => {
  invariant(iframeRef.value, "iframeRef must be defined");

  // Set up Penpal connection to communicate with iframe
  try {
    if (!iframeRef.value?.contentWindow) {
      console.warn("[PARENT] iframe contentWindow not available yet");
      return;
    }

    const messenger = new Penpal.WindowMessenger({
      remoteWindow: iframeRef.value.contentWindow,
      allowedOrigins: ["*"], // Allow any origin for now
    });

    const connection = Penpal.connect({
      messenger,
      methods: {
        updateHeight(height: number) {
          iframeHeight.value = height;
          console.log(`[PARENT] Iframe height updated to: ${height}px`);
        },
      },
    });

    // Wait for connection to establish
    await connection.promise;
    console.log(
      "[PARENT] Penpal connection established with inline asset iframe"
    );
  } catch (error) {
    console.warn("[PARENT] Failed to establish Penpal connection:", error);
  }
});
</script>
