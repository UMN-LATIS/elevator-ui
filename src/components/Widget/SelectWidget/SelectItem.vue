<template>
  <li v-for="(content, key) in contentAsArray" :key="key">
    <Link :widget="widget" :linkText="getDisplayText(content)">
      <div v-html="getDisplayText(content)" />
    </Link>
  </li>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Link from "@/components/Link/Link.vue";
import { SelectWidgetProps, SelectWidgetContents } from "@/types";

const props = defineProps<{
  selectValues: SelectWidgetContents;
  widget: SelectWidgetProps;
}>();

const contentAsArray = computed(() => {
  if (typeof props.selectValues.fieldContents === "string") {
    return [props.selectValues.fieldContents];
  } else {
    return props.selectValues.fieldContents;
  }
});

function getDisplayText(content: string): string {
  if (props.widget.fieldData.selectGroup?.hasOwnProperty(content)) {
    return props.widget.fieldData?.selectGroup[content];
  } else {
    return content;
  }
}
</script>
