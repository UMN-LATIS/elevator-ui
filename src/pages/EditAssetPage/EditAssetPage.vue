<template>
  <DefaultLayout>
    <div
      class="p-8 mx-auto w-full max-w-screen-lg bg-white shadow-sm rounded-lg my-10">
      <h1 class="text-2xl font-bold mb-4">Edit Asset</h1>

      <Transition name="fade">
        <div v-if="asset && template" class="widget-list flex flex-col gap-4">
          <EditWidget
            v-for="widget in template.widgetArray"
            :key="widget.widgetId"
            :widget="widget"
            :asset="asset" />
        </div>
      </Transition>
    </div>
  </DefaultLayout>
</template>
<script setup lang="ts">
import { computed } from "vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import { useAssetQuery } from "@/queries/useAssetQuery";
import { useTemplateQuery } from "@/queries/useTemplateQuery";
import EditWidget from "@/components/EditWidget/EditWidget.vue";

const props = defineProps<{
  assetId: string;
}>();

const { data: asset } = useAssetQuery(() => props.assetId);
const templateId = computed(() => asset.value?.templateId || null);
const { data: template } = useTemplateQuery(templateId);
</script>
<style scoped></style>
