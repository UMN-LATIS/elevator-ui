<template>
  <ClickToSearchLink :widget="widget" :linkText="dateString">
    <template v-if="dateContent.label">
      <Tuple :label="dateContent.label" variant="inline">
        {{ dateString }}
      </Tuple>
    </template>
    <template v-else>
      {{ dateString }}
    </template>
  </ClickToSearchLink>
</template>

<script setup lang="ts">
import ClickToSearchLink from "@/components/ClickToSearchLink/ClickToSearchLink.vue";
import { computed } from "vue";
import { DateWidgetDef, DateWidgetContent } from "@/types";
import Tuple from "@/components/Tuple/Tuple.vue";

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
