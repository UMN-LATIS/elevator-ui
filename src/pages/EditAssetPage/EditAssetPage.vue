<template>
  <DefaultLayout>
    <div
      class="p-8 mx-auto w-full max-w-screen-lg bg-white shadow-sm rounded-lg my-10">
      <h1 class="text-2xl font-bold mb-4">Edit Asset</h1>

      <Transition name="fade">
        <EditAssetForm
          v-if="asset && template"
          :asset="asset"
          :template="template" />
      </Transition>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { computed, watch } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAssetQuery } from "@/queries/useAssetQuery";
import { useTemplateQuery } from "@/queries/useTemplateQuery";
import EditAssetForm from "@/components/EditAssetForm/EditAssetForm.vue";
import { useEditAssetStore } from "@/stores/useEditAssetStore";

const props = defineProps<{
  assetId: string;
}>();

const templateId = computed(() => asset.value?.templateId || null);
const { data: asset } = useAssetQuery(() => props.assetId);
const { data: template } = useTemplateQuery(templateId);
const editAssetStore = useEditAssetStore();

watch(
  [asset, template],
  () => {
    if (!asset.value || !template.value) {
      return;
    }

    editAssetStore.initAsset({
      asset: asset.value,
      template: template.value,
    });
  },
  {
    immediate: true,
  }
);
</script>
<style scoped></style>
