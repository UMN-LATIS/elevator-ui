<template>
  <DefaultLayout>
    <div class="container py-10 mx-auto">
      <h1 class="text-2xl font-bold">Edit Asset</h1>
      {{ assetId }}

      <h2>Asset</h2>
      <code>{{ asset }}</code>
      <h2>Template</h2>
      {{ templateId }}
      <code v-if="isTemplateLoading">Loading...</code>
      <code v-else-if="!template">No template found</code>
      <code>{{ template }}</code>
      <!-- <AssetForm :asset="asset" /> -->
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { computed } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAssetQuery } from "@/queries/useAssetQuery";
import { useTemplateQuery } from "@/queries/useTemplateQuery";
const props = defineProps<{
  assetId: string;
}>();

const { data: asset } = useAssetQuery(() => props.assetId);
const templateId = computed(() => asset.value?.templateId || null);
const { data: template, isLoading: isTemplateLoading } =
  useTemplateQuery(templateId);
</script>
<style scoped></style>
