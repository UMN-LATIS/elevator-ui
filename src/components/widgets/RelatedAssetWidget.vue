<template>
  <div class="related-asset-widget"></div>
</template>
<script setup lang="ts">
import { Asset, WidgetProps, WidgetContents } from "@/types";

const props = defineProps<{
  widget: WidgetProps;
  contents: WidgetContents;
  asset: Asset;
}>();

console.log({
  widget: props.widget,
  contents: props.contents,
  asset: props.asset,
});
</script>
<style scoped></style>
