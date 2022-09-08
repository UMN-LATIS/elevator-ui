<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <MultiSelectItem :widget="widget" :content="content"></MultiSelectItem>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { MultiSelectWidgetProps, MultiSelectWidgetContent } from "@/types";
import MultiSelectItem from "./MultiSelectItem.vue";

interface Props {
  widget: MultiSelectWidgetProps;
  contents: MultiSelectWidgetContent[];
}

defineProps<Props>();
</script>
