<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <DateWidgetItem :dateContent="content" :widget="widget"></DateWidgetItem>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { DateWidgetDef, DateWidgetContent } from "@/types";
import DateWidgetItem from "./DateWidgetItem.vue";

interface Props {
  widget: DateWidgetDef;
  contents: DateWidgetContent[];
}

defineProps<Props>();
</script>
