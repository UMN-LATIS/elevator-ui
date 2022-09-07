<template>
  <div class="accordion-related-asset-widget-item">
    <Accordion :label="title">
      <WidgetList :assetId="assetId" />
    </Accordion>
  </div>
</template>
<script setup lang="ts">
import Accordion from "@/components/Accordion/Accordion.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";

defineProps<{
  assetId: string;
  title: string;
}>();
</script>
<style scoped></style>
