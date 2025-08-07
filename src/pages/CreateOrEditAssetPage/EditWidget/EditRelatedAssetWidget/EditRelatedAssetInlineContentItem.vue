<template>
  <div class="overflow-hidden">
    {{ modelValue }}
    <div v-if="!templateId" class="text-red-500">
      No template selected for this related asset widget. Please set
      <code class="font-mono bg-black/5">defaultTemplate</code>
      in the widget definition.
    </div>
    <iframe
      v-else
      ref="iframeRef"
      :src="iframeUrl"
      class="w-full border-0"
      frameborder="0"
      :height="iframeHeight || 500" />
  </div>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import invariant from "tiny-invariant";
import { computed, useTemplateRef, ref, onMounted, inject } from "vue";
import * as Penpal from "penpal";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/components/DragDropList/constants";

const props = defineProps<{
  collectionId: Type.AssetCollection["id"];
  modelValue: Type.WithId<Type.RelatedAssetWidgetContent>;
  assetId: string | null; // need current assetId to prevent circular dependencies
  widgetDef: Type.RelatedAssetWidgetDef;
}>();

const emit = defineEmits<{
  (
    e: "update:modelValue",
    modelValue: Type.WithId<Type.RelatedAssetWidgetContent>
  ): void;
}>();

const iframeRef = useTemplateRef<HTMLIFrameElement>("iframeRef");
const iframeUrl = computed(() => {
  // if no target asset, then it's a new asset
  const isNewAsset = !props.modelValue.targetAssetId;

  return isNewAsset
    ? `/assetManager/addAsset/${templateId.value}/${props.collectionId}/true`
    : `/assetManager/editAsset/${props.modelValue.targetAssetId}/true`;
});

const templateId = computed((): Type.Template["templateId"] | null => {
  return props.widgetDef.fieldData.defaultTemplate ?? null;
});

const iframeHeight = ref<number>(500);
const assetEditor = inject(ASSET_EDITOR_PROVIDE_KEY);

let iframeConnection: Type.InlineRelatedAssetChildMethods | null = null;

onMounted(async () => {
  invariant(iframeRef.value, "iframeRef must be defined");
  // we want to save the iframe asset before the parent saves
  // so we register a before save callback
  invariant(
    assetEditor,
    "Asset editor must be provided to register before save callback"
  );

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

    const parentMethods: Type.InlineRelatedAssetParentMethods = {
      updateHeight(height: number) {
        iframeHeight.value = height;
        console.log(`[PARENT] Iframe height updated to: ${height}px`);
      },
      // onBeforeSave(fn: () => Promise<void>) {
      //   assetEditor.onBeforeSave(fn);
      // },
    };

    iframeConnection =
      await Penpal.connect<Type.InlineRelatedAssetChildMethods>({
        messenger,
        methods: parentMethods,
      }).promise;

    // Wait for connection to establish
    console.log(
      "[PARENT] Penpal connection established with inline asset iframe"
    );

    assetEditor.onBeforeSave(async () => {
      invariant(
        iframeConnection,
        "Iframe connection must be established to save asset"
      );

      // notify the iframe to save its asset
      console.log("[PARENT] Notifying iframe to save asset");
      const relatedAssetId = await iframeConnection.saveAsset();
      console.log("[PARENT] Iframe asset saved successfully");

      // now update this widget content with the new related asset ID
      emit("update:modelValue", {
        ...props.modelValue,
        targetAssetId: relatedAssetId,
      });
    });
  } catch (error) {
    console.warn("[PARENT] Failed to establish Penpal connection:", error);
  }
});
</script>
