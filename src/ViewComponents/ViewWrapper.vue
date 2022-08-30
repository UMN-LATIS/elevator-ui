<template>
  <ViewContainer
    v-if="asset && template"
    :asset="asset"
    :template="template"
    :isPrimaryElement="false"
  />
</template>

<script setup lang="ts">
import { getAsset } from "@/Helpers/displayUtils";
import ViewContainer from "@/ViewComponents/ViewContainer.vue";
import { onMounted, ref } from "vue";
import { useTemplateStore } from "@/stores/templateStore";
import { Asset, Template } from "@/types";

const asset = ref<Asset | null>(null);
const template = ref<Template | null>(null);
const templateStore = useTemplateStore();

const props = defineProps<{
  objectId: string;
}>();

onMounted(async () => {
  asset.value = await getAsset(props.objectId);
  template.value = await templateStore.loadTemplate(asset.value.templateId);
});
</script>
