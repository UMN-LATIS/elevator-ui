<template>
  <section
    class="collapsed-inline-related-asset-widget-item"
    :class="{
      'bg-transparent-black-50 p-4 rounded': isAssetReady,
    }"
  >
    <h3>{{ title }}</h3>
    <div v-if="isAssetReady" class="mt-4">
      <WidgetList :assetId="assetId" />
    </div>
  </section>
</template>
<script setup lang="ts">
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { useAssetStore } from "@/stores/assetStore";
import { onMounted, ref, computed } from "vue";
import { Asset } from "@/types";

const props = defineProps<{
  assetId: string;
  title: string;
}>();

const asset = ref<Asset | null>(null);

// check if the asset is successfull loaded
// before rendering the WidgetList to prevent weird
// styling where content should be
const isAssetReady = computed((): boolean => !!asset.value);

onMounted(async () => {
  const assetStore = useAssetStore();
  asset.value = await assetStore.fetchAsset(props.assetId);
});
</script>
<style scoped></style>
