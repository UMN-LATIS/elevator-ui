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
      :src="iframeUrl"
      class="w-full border-0"
      frameborder="0"
      :height="iframeHeight || 500" />
  </div>
</template>
<script setup lang="ts">
import * as Type from "@/types";
import invariant from "tiny-invariant";
import { computed, useTemplateRef, ref, inject, onUnmounted, watch } from "vue";
import * as Penpal from "penpal";
import { ASSET_EDITOR_PROVIDE_KEY } from "@/components/DragDropList/constants";
import config from "@/config";

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

const iframeHeight = ref(500);
const iframeRef = useTemplateRef<HTMLIFrameElement>("iframeRef");
const assetEditor = inject(ASSET_EDITOR_PROVIDE_KEY);
let iframeConnection: Type.InlineRelatedAssetChildMethods | null = null;

console.log(config.instance.base);
const BASE_URL = config.instance.base.url;

const iframeUrl = computed(() => {
  const isNewAsset = !props.modelValue.targetAssetId;
  return isNewAsset
    ? `${BASE_URL}/assetManager/addAsset/${templateId.value}/${props.collectionId}/true`
    : `${BASE_URL}/assetManager/editAsset/${props.modelValue.targetAssetId}/true`;
});

const templateId = computed((): Type.Template["templateId"] | null => {
  return props.widgetDef.fieldData.defaultTemplate ?? null;
});

async function setupIframeConnection(): Promise<Type.InlineRelatedAssetChildMethods> {
  invariant(
    iframeRef.value?.contentWindow,
    "Iframe must have a defined contentWindow"
  );

  const messenger = new Penpal.WindowMessenger({
    remoteWindow: iframeRef.value.contentWindow,
    allowedOrigins: ["*"], // Allow any origin for now
  });

  const parentMethods: Type.InlineRelatedAssetParentMethods = {
    updateHeight(height: number) {
      iframeHeight.value = height;
    },
    updateHasRelatedAssetChanged(isChanged: boolean) {
      invariant(
        assetEditor,
        "Cannot update relative asset change: no asset editor provided"
      );
      assetEditor.updateModifiedInlineRelatedAsset(
        props.modelValue.id,
        isChanged
      );
    },
  };

  // Note on the typing
  // Penpal.connect's generic wants the child methods
  // so that it knows what methods are available on the connection
  // meanwhile we pass the parent methods to the connect function
  // to expose them to the child iframe
  return Penpal.connect<Type.InlineRelatedAssetChildMethods>({
    messenger,
    methods: parentMethods,
  }).promise;
}

watch([iframeUrl, iframeRef], async () => {
  invariant(assetEditor);

  if (iframeConnection || !iframeRef.value) {
    return;
  }

  iframeConnection = await setupIframeConnection();

  assetEditor.onBeforeSave(async () => {
    invariant(iframeConnection);
    const relatedAssetId = await iframeConnection.saveAsset();

    if (relatedAssetId) {
      emit("update:modelValue", {
        ...props.modelValue,
        targetAssetId: relatedAssetId,
      });
    }
  });
});

onUnmounted(() => {
  iframeConnection = null;
});
</script>
