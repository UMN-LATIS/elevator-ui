<template>
  <div class="">Edit TextWidget</div>
</template>
<script setup lang="ts">
import { TextWidgetContent, WidgetProps } from "@/types";

defineProps<{
  widgetDef: WidgetProps;
  widgetContents: TextWidgetContent[];
}>();
</script>
<style scoped></style>
