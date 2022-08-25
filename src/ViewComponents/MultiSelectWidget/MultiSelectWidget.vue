<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <MultiSelectItem :widget="widget" :content="content"></MultiSelectItem>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { Widget, WidgetContents } from "@/types";
import MultiSelectItem from "@/ViewComponents/MultiSelectWidget/MultiSelectItem.vue";

interface Props {
  widget: Widget;
  contents: WidgetContents[];
}

const props = defineProps<Props>();
</script>
