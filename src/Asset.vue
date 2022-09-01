<template>
  <div v-if="asset && template" class="grid grid-cols-2 gap-8">
    <div>
      <DigitalAssetContainer
        v-if="fileObjectId && objectId"
        :fileObjectId="fileObjectId"
        :objectId="objectId"
      />
      <ViewWrapper v-if="objectId" :objectId="objectId" />
    </div>
    <div>
      <TitleDisplay :asset="asset"></TitleDisplay>
      <ViewContainer
        :asset="asset"
        :template="template"
        :isPrimaryElement="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { getAsset } from "@/Helpers/displayUtils";
import ViewContainer from "@/ViewComponents/ViewContainer.vue";
import ViewWrapper from "@/ViewComponents/ViewWrapper.vue";
import DigitalAssetContainer from "@/ViewComponents/DigitalAssetContainer.vue";
import TitleDisplay from "@/ViewComponents/TitleDisplay.vue";
import { useTemplateStore } from "@/stores/templateStore";
import { Asset, Template } from "./types";

const props = defineProps<{
  assetId: string;
}>();

const templateStore = useTemplateStore();

const asset = ref<Asset | null>(null);
const template = ref<Template | null>(null);

const objectId = computed(() => asset.value?.firstObjectId ?? null);
const fileObjectId = computed(() => asset.value?.firstFileHandlerId ?? null);

onMounted(async () => {
  asset.value = await getAsset(props.assetId);
  const templateId = asset.value?.templateId.toString() ?? null;

  if (!templateId) {
    throw new Error("no templateId for this asset");
  }

  template.value = await templateStore.loadTemplate(templateId);
});
</script>
