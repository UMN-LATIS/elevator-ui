<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <MultiSelectItem :widget="widget" :content="content"></MultiSelectItem>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { MultiSelectWidget, MultiSelectWidgetContents } from "@/types";
import MultiSelectItem from "@/ViewComponents/MultiSelectWidget/MultiSelectItem.vue";

interface Props {
  widget: MultiSelectWidget;
  contents: MultiSelectWidgetContents[];
}

defineProps<Props>();
</script>
