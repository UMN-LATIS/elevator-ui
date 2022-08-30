<template>
  <li v-for="(content, key) in contentAsArray" :key="key">
    <Link :widget="widget" :linkText="content">
      <div v-html="content" />
    </Link>
  </li>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Link from "@/Helpers/Link/Link.vue";
import { SelectWidget, SelectWidgetContents } from "@/types";

const props = defineProps<{
  selectValues: SelectWidgetContents;
  widget: SelectWidget;
}>();

const contentAsArray = computed(() => {
  if (typeof props.selectValues.fieldContents === "string") {
    return [props.selectValues.fieldContents];
  } else {
    return props.selectValues.fieldContents;
  }
});

// FIXME: selectGroup is possibly undefined. What's the intent here?
// function getDisplayText(content: string): string {
//   if (props.widget.fieldData.selectGroup.hasOwnProperty(content)) {
//     return props.widget.fieldData?.selectGroup[content];
//   } else {
//     return content;
//   }
// }
</script>
