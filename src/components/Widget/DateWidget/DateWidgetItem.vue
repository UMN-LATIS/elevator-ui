<template>
  <Link :widget="widget" :linkText="dateString">
    <template v-if="dateContent.label">
      <Tuple :label="dateContent.label" variant="inline"
        >{{ dateString }}
      </Tuple>
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
import Tuple from "@/components/Tuple/Tuple.vue";

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
