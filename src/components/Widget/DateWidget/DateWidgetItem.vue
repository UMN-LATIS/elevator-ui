<template>
  <Link :widget="widget" :linkText="dateString">
    <template v-if="dateContent.label">
      {{ dateContent.label }} <span class="date_value">({{ dateString }})</span>
    </template>
    <template v-else>
      {{ dateString }}
    </template>
  </Link>
</template>

<script setup lang="ts">
import Link from "@/components/Link/Link.vue";
import { computed } from "vue";
import { DateWidgetProps, DateWidgetContent } from "@/types";

interface Props {
  dateContent: DateWidgetContent;
  widget: DateWidgetProps;
}

const props = defineProps<Props>();

const dateString = computed(() => {
  let outputString = "";
  outputString += props.dateContent.start.text;
  if (props.dateContent.range) {
    outputString += " - " + props.dateContent.end.text;
  }
  return outputString;
});
</script>
