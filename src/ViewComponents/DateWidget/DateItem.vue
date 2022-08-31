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
import Link from "@/Helpers/Link/Link.vue";
import { computed } from "vue";
import { Widget } from "@/types";

interface DateMoment {
  text: string;
  numeric: number;
}

interface DateContent {
  label: string;
  start: DateMoment;
  end: DateMoment;
  range?: boolean;
}

interface Props {
  dateContent: DateContent;
  widget: Widget;
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
