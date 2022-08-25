<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <DateItem :dateContent="content" :widget="widget"></DateItem>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { Widget, WidgetContents } from "@/types";
import DateItem from "@/ViewComponents/DateWidget/DateItem.vue";

interface Props {
  widget: Widget;
  contents: WidgetContents[];
}

const props = defineProps<Props>();
</script>
