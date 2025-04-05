<template>
  <Tuple :label="widget.label" class="widget">
    <div v-for="(contentRow, index) in localWidgetContents" :key="index">
      {{ contentRow }}
    </div>
  </Tuple>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import * as Type from "@/types";
import { getWidgetContents } from "@/helpers/displayUtils";

const props = defineProps<{
  widget: Type.TextTemplateWidgetProps;
  asset: Type.Asset;
}>();

const localWidgetContents = ref([] as Type.TextWidgetContent[]);

onMounted(() => {
  localWidgetContents.value = getWidgetContents({
    asset: props.asset,
    widget: props.widget,
  }) as Type.TextWidgetContent[];
});

// should each widget row have a specific id?
// or should we just use the index as the key?
// with index, will be have problems with reordering?
</script>
<style scoped></style>
