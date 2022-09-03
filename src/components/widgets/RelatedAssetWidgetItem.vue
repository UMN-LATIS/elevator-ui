<template>
  <div class="related-asset-widget-item">
    <Accordion :label="title">
      <WidgetList :assetId="assetId" />
    </Accordion>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import Accordion from "@/components/Accordion.vue";
import { useAssetTitle } from "@/composables/useAssetTitle";
import { useAssetStore } from "@/stores/newAssetStore";
import WidgetList from "../WidgetList.vue";
import { Asset } from "@/types";

const props = defineProps<{
  assetId: string;
  title: string;
}>();
</script>
<style scoped></style>
