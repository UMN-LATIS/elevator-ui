<template>
  <div class="flex-container" v-if="asset && template">
    <div class="flex-child">
      <DigitalAssetContainer />
      <ViewWrapper v-if="store.objectId" :objectId="store.objectId" />
    </div>
    <div class="flex-child">
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
import { onMounted } from "@vue/runtime-core";
import { ref } from "vue";
import { getAsset, getTemplate } from "@/Helpers/displayUtils";
import ViewContainer from "@/ViewComponents/ViewContainer.vue";
import ViewWrapper from "@/ViewComponents/ViewWrapper.vue";
import DigitalAssetContainer from "@/ViewComponents/DigitalAssetContainer.vue";
import TitleDisplay from "@/ViewComponents/TitleDisplay.vue";
import { useAssetStore } from "@/stores/assetStore";
import { useTemplateStore } from "@/stores/templateStore";

const templateStore = useTemplateStore();
const store = useAssetStore();

store.objectId = null;
store.fileObjectId = null;

interface Props {
  objectId: string;
}

const asset: any = ref(null);
const template: any = ref(null);

onMounted(async () => {
  asset.value = await getAsset(props.objectId);
  if (asset && asset.value && asset.value.templateId) {
    template.value = await templateStore.loadTemplate(asset.value.templateId);
    if (asset.value.firstFileHandlerId) {
      store.fileObjectId = asset.value.firstFileHandlerId;
      store.objectId = asset.value.firstObjectId;
    }
  }
});
const props = defineProps<Props>();
</script>

<style scoped>
.flex-container {
  display: flex;
}
.flex-child {
  flex: 1;
  margin-let: 1em;
  margin-right: 1em;
}
</style>
