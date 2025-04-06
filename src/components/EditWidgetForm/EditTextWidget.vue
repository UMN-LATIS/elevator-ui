<template>
  <Tuple :label="widget.label" class="widget">
    <DragDropContainer :groupId="widget.widgetId">
      <DragDropList v-model="localWidgetContents" :listId="widget.widgetId">
        <template #item="{ item }">
          <div class="list-item">
            <div class="text-content">
              {{ item.content.fieldContents }}
            </div>
          </div>
        </template>
      </DragDropList>
    </DragDropContainer>
    <div v-for="(contentRow, index) in localWidgetContents" :key="index">
      {{ contentRow }}
    </div>
  </Tuple>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import * as Type from "@/types";
import { getWidgetContents } from "@/helpers/displayUtils";
import { DragDropContainer, DragDropList } from "@/components/DragDropList";
import Tuple from "@/components/Tuple/Tuple.vue";

const props = defineProps<{
  widget: Type.TextTemplateWidgetProps;
  asset: Type.Asset;
}>();

type WidgetContentWithId = {
  id: string;
  content: Type.TextWidgetContent;
};

const localWidgetContents = ref<WidgetContentWithId[]>([]);

onMounted(() => {
  const contents = getWidgetContents({
    asset: props.asset,
    widget: props.widget,
  }) as Type.TextWidgetContent[];

  localWidgetContents.value = contents.map((content) => ({
    id: crypto.randomUUID(),
    content,
  }));
});

// should each widget row have a specific id?
// or should we just use the index as the key?
// with index, will be have problems with reordering?
</script>
<style scoped></style>
