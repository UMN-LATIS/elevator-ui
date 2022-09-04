<template>
  <section class="object-viewer bg-neutral-400">
    <h2 class="sr-only">Object Viewer</h2>
    <iframe
      v-if="embedLink"
      class="object-viewer__iframe w-full h-full min-h-[20rem]"
      :src="embedLink"
      frameBorder="0"
      allowfullscreen="true"
    ></iframe>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import config from "@/config";
import { Asset } from "@/types";
import { useAssetStore } from "@/stores/assetStore";

const props = defineProps<{
  objectId: string;
}>();

// this is the object that will be viewed
// (of type asset)
const objectAsset = ref<Asset | null>(null);
const fileObjectId = computed(
  () => objectAsset.value?.firstFileHandlerId ?? null
);

const embedLink = computed((): null | string => {
  if (!props.objectId || !fileObjectId.value) {
    return null;
  }

  return `${config.baseUrl}/asset/getEmbed/${fileObjectId.value}/${props.objectId}`;
});

const assetStore = useAssetStore();

onMounted(async () => {
  objectAsset.value = await assetStore.fetchAsset(props.objectId);
});
</script>
