<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <DateWidgetItem :dateContent="content" :widget="widget"></DateWidgetItem>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { DateWidgetProps, DateWidgetContents } from "@/types";
import DateWidgetItem from "./DateWidgetItem.vue";

interface Props {
  widget: DateWidgetProps;
  contents: DateWidgetContents[];
}

defineProps<Props>();
</script>
