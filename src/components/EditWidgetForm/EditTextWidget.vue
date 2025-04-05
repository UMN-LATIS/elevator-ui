<template>
  <div class="">
    <Tuple v-if="widget.label" :label="widget.label" class="widget">
      <component
        :is="getWidgetComponentByType(widget.type)"
        v-if="getWidgetComponentByType(widget.type)"
        :widget="widget"
        :contents="widgetContents"
        :asset="asset"></component>
    </Tuple>
    <component
      :is="getWidgetComponentByType(widget.type)"
      v-else
      :widget="widget"
      :contents="widgetContents"
      :asset="asset"></component>
  </div>
</template>
<script setup lang="ts">
import * as Type from "@/types";
defineProps<{
  widget: Type.TextTemplateWidgetProps;
  asset: Type.Asset;
  contents: Type.TextWidgetContent[];
}>();
</script>
<style scoped></style>
