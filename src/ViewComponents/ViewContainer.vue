<template>
  <div v-if="template">
    <template v-for="widget in sortedWidgetArray" :key="widget.id">
      <div
        v-if="widget.display && asset[widget.fieldTitle]"
        class="assetWidget"
      >
        <WidgetBase
          :contents="asset[widget.fieldTitle]"
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
import { Widget } from "@/types";
import WidgetBase from "./WidgetBase.vue";

interface Props {
  template: any;
  asset: any;
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

<style scoped>
.assetWidget {
  margin-top: 1em;
  margin-bottom: 1em;
}
</style>
