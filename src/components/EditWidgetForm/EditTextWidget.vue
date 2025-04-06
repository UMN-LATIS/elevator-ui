<template>
  <div class="flex gap-4 border-t-2 border-neutral-900 py-4">
    <div class="w-1/3">
      <h2 class="text-2xl font-bold">{{ widget.label }}</h2>
    </div>
    <DragDropContainer :groupId="widget.widgetId" class="w-2/3">
      <DragDropList v-model="localWidgetContents" :listId="widget.widgetId">
        <template #header>
          <div class="flex items-center w-full gap-4 mb-1">
            <div class="w-8"><!-- handle --></div>
            <div class="text-xs w-12 font-bold">Pri</div>
            <div class="flex-1">{{ widget.label }}</div>
            <Button variant="tertiary">
              <PlusIcon class="w-4 h-4" />
              <span class="ml-2">Add {{ widget.label }}</span>
            </Button>
          </div>
        </template>
        <template #item="{ item }">
          <div class="px-4 py-2 flex items-center gap-4">
            <div>
              <label>
                <input
                  v-model="item.content.isPrimary"
                  type="radio"
                  name="primary" />
                <span class="sr-only">Primary</span>
              </label>
            </div>
            <div class="flex-1">
              <label :for="`${item.id}-input`" class="sr-only">
                {{ widget.label }}
              </label>
              <Input
                :id="`${item.id}-input`"
                v-model="item.content.fieldContents"
                :placeholder="widget.label"
                class="bg-black/5 border-none" />
            </div>
            <div>
              <Button variant="tertiary" size="sm">
                <VerticalDotsIcon class="w-4 h-4" />
                <span class="sr-only">More</span>
              </Button>
            </div>
          </div>
        </template>
      </DragDropList>
    </DragDropContainer>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import * as Type from "@/types";
import { getWidgetContents } from "@/helpers/displayUtils";
import { DragDropContainer, DragDropList } from "@/components/DragDropList";
import Tuple from "@/components/Tuple/Tuple.vue";
import { Input } from "../ui/input";
import Button from "../Button/Button.vue";
import { PlusIcon } from "lucide-vue-next";
import { VerticalDotsIcon } from "@/icons";

const props = defineProps<{
  widget: Type.TextTemplateWidgetProps;
  asset: Type.Asset;
}>();

type WidgetContentWithId = {
  id: string;
  content: Type.TextWidgetContent;
};

const localWidgetContents = reactive<WidgetContentWithId[]>([]);

onMounted(() => {
  const contents = getWidgetContents({
    asset: props.asset,
    widget: props.widget,
  }) as Type.TextWidgetContent[];

  const contentsWithId = contents.map((content) => ({
    id: crypto.randomUUID(),
    content,
  }));

  localWidgetContents.push(...contentsWithId);
});

// should each widget row have a specific id?
// or should we just use the index as the key?
// with index, will be have problems with reordering?
</script>
<style scoped></style>
