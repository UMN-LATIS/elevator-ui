<template>
  <div v-if="asset && template" class="grid grid-cols-2 gap-8">
    <div>
      <DigitalAssetContainer />
      <ViewWrapper v-if="assetStore.objectId" :objectId="assetStore.objectId" />
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
import { onMounted } from "vue";
import { ref } from "vue";
import { getAsset } from "@/Helpers/displayUtils";
import ViewContainer from "@/ViewComponents/ViewContainer.vue";
import ViewWrapper from "@/ViewComponents/ViewWrapper.vue";
import DigitalAssetContainer from "@/ViewComponents/DigitalAssetContainer.vue";
import TitleDisplay from "@/ViewComponents/TitleDisplay.vue";
import { useAssetStore } from "@/stores/assetStore";
import { useTemplateStore } from "@/stores/templateStore";
import { Asset, Template } from "./types";

const templateStore = useTemplateStore();
const assetStore = useAssetStore();

assetStore.objectId = null;
assetStore.fileObjectId = null;

interface Props {
  objectId: string;
}

const asset = ref<Asset | null>(null);
const template = ref<Template | null>(null);

onMounted(async () => {
  asset.value = await getAsset(props.objectId);
  if (asset.value?.templateId) {
    template.value = await templateStore.loadTemplate(
      asset.value.templateId.toString()
    );
    if (asset.value?.firstFileHandlerId) {
      assetStore.fileObjectId = asset.value.firstFileHandlerId;
      assetStore.objectId = asset.value.firstObjectId ?? null;
    }
  }
});
const props = defineProps<Props>();
</script>
