<template>
  <div v-if="asset && template" class="edit-asset-form flex flex-col gap-4">
    <EditWidget
      v-for="{ widgetDef, widgetContents } in widgetDefAndContents"
      :key="widgetDef.widgetId"
      :widgetDef="widgetDef"
      :widgetContents="widgetContents" />
  </div>
</template>
<script setup lang="ts">
import { getWidgetContents } from "@/helpers/displayUtils";
import EditWidget from "./EditWidget/EditWidget.vue";
import { Asset, Template, WidgetProps, WidgetContent } from "@/types";
import { computed } from "vue";
import invariant from "tiny-invariant";

const props = defineProps<{
  asset: Asset;
  template: Template;
}>();

interface WidgetDefAndContents {
  widgetDef: WidgetProps;
  widgetContents: WidgetContent[];
}

const widgetDefAndContents = computed((): WidgetDefAndContents[] => {
  return props.template.widgetArray.map((widgetDef) => {
    const widgetContents = getWidgetContents({
      asset: props.asset,
      widget: widgetDef,
    });

    invariant(
      widgetContents,
      `Widget contents for ${widgetDef.widgetId} should not be null`
    );

    return {
      widgetDef,
      widgetContents,
    };
  });
});
</script>
<style scoped></style>
