<template>
  <div>
    <template v-for="widget in sortedWidgetArray" :key="widget.id">
      <div
        v-if="widget.display && asset[widget.fieldTitle]"
        class="assetWidget"
      >
        <WidgetBase
          :contents="(asset[widget.fieldTitle] as WidgetContents[])"
          :widget="widget"
          :asset="asset"
        >
        </WidgetBase>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Asset, Template, Widget, WidgetContents } from "@/types";
import WidgetBase from "@/components/Widget.vue";

interface Props {
  template: Template;
  asset: Asset;
  isPrimaryElement: boolean;
}

const props = defineProps<Props>();

const sortedWidgetArray = computed((): Widget[] => {
  const sortedArray = [...props.template.widgetArray].sort((a, b) => {
    return a.viewOrder - b.viewOrder;
  });
  return sortedArray;
});
</script>
