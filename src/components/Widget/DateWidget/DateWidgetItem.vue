<template>
  <div class="flex flex-col">
    <ClickToSearchLink :widget="widget" :linkText="dateString">
      {{ dateString }}
    </ClickToSearchLink>
    <span v-if="dateContent.label" class="text-sm">
      {{ dateContent.label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import ClickToSearchLink from "@/components/ClickToSearchLink/ClickToSearchLink.vue";
import { computed } from "vue";
import { DateWidgetDef, DateWidgetContent } from "@/types";

interface Props {
  dateContent: DateWidgetContent;
  widget: DateWidgetDef;
}

const props = defineProps<Props>();

const hasEndDate = (dateContent: DateWidgetContent) =>
  dateContent.end.text !== null && dateContent.end.text !== "";

const dateString = computed(() => {
  return hasEndDate(props.dateContent)
    ? `${props.dateContent.start.text} - ${props.dateContent.end.text}`
    : props.dateContent.start.text ?? "-";
});
</script>
