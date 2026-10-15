<template>
  <ClickToSearchLink :widget="widget" :linkText="dateString">
    <span class="whitespace-nowrap">{{ dateString }}</span>
  </ClickToSearchLink>
  <template v-if="dateContent.label">
    <!-- Deleting this space runs the date into the label, because Vue drops
      whitespace that spans a newline; date-widget-label.spec.ts then fails -->
    {{ " " }}
    <span class="text-sm">{{ dateContent.label }}</span>
  </template>
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
