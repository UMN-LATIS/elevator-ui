<template>
  <div v-if="template">
    <template v-for="widget in sortedWidgetArray" :key="widget.id">
      <div
        class="assetWidget"
        v-if="widget.display && asset[widget.fieldTitle]"
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
import { computed, onMounted, ref } from "vue";
import { useAssetStore } from "@/stores/assetStore";
import { useTemplateStore } from "@/stores/templateStore";
import { Widget } from "@/types";
import { getAsset } from "@/Helpers/displayUtils";
import WidgetBase from "./WidgetBase.vue";

const store = useAssetStore();
const templateStore = useTemplateStore();

interface Props {
  template: any;
  asset: any;
  isPrimaryElement: boolean;
}

const props = defineProps<Props>();

const sortedWidgetArray = computed((): Widget[] => {
  const sortedArray = props.template.widgetArray.sort((a, b) => {
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
