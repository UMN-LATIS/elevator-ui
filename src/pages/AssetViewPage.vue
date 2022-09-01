<template>
  <div class="asset-view-page">
    <div>Asset Viewer</div>
    <div>
      <h2>Details Container</h2>
      <pre>{{ viewerObject }}</pre>
    </div>
    <div>
      <h1>Main MetaData Container</h1>
      <pre>{{ asset }}</pre>
    </div>
  </div>
</template>
<script setup lang="ts">
/**
 * Some context and definitions:
 * - Elevator is a repository of assets.
 * - An asset can have multiple objects.
 * - A template is associated with an asset, and determines
 * how the page should look (that is, which widgets should
 * be used to display which data).
 *
 * For example:
 * The Winton Guest House by Frank Gehry is an asset.
 * The asset has multiple objects, e.g. an
 * interior view, exterior view, floor plan.
 * (Each object is also an asset type.)
 * The asset has a template that defines which
 * metadata should use which component for rendering,
 * The component is called a widget.
 * For example, the date of construction metadata might be
 * rendered with a date widget, the location of the house
 * with a location widget, and a description with a text widget.
 * The template determines the order of the widgets.
 *
 * This Page renders an Asset.
 * Specifically, there are major sections:
 * 1. The asset viewer iframe. This might be a pdf viewer,
 *    image viewer, an audio player, etc.
 *    (e.g. a image viewer that lets the user zoom in and out
 *     of the Winton Guest House)
 * 2. The asset metadata. That is, meta data associated with
 *    all objects that make up the asset.
 *    (e.g. "Winton Guest Hosue")
 * 3. The object metadata. That is, detailed metadata specifically
 *    about the object that's in the asset viewer iframe.
 *    (e.g. "Exterior View")
 *
 * In this page component, we'll get data for all 3 parts and
 * pass it down to the appropriate widgets.
 */

import { onMounted, ref } from "vue";
import { useAssetStore } from "@/stores/newAssetStore";
import { useTemplateStore } from "@/stores/newTemplateStore";
import { Asset, Template } from "@/types";
import { useNotificationStore } from "@/stores/notificationStore";

const props = defineProps<{
  assetId: string;
}>();

const assetStore = useAssetStore();
const templateStore = useTemplateStore();
const notificationStore = useNotificationStore();

const asset = ref<Asset | null>(null);
const template = ref<Template | null>(null);

// the object specifically being viewed on the page
// this is id'd by the asset.firstObjectId
const viewerObject = ref<Asset | null>(null);

onMounted(async () => {
  // get meta data for this asset
  asset.value = await assetStore.fetchAsset(props.assetId);

  if (!asset.value) {
    notificationStore.show(`Could not get asset with id ${props.assetId}`);
    return;
  }

  // get the template for this asset
  template.value = await templateStore.fetchTemplate(asset.value.templateId);

  // get the metadata for the object appearing in the viewer
  if (asset.value.firstObjectId) {
    viewerObject.value = await assetStore.fetchAsset(asset.value.firstObjectId);
  }
});
</script>
<style scoped></style>
