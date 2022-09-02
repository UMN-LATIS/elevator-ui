<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <DateItem :dateContent="content" :widget="widget"></DateItem>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { DateWidgetProps, DateWidgetContents } from "@/types";
import DateItem from "@/ViewComponents/DateWidget/DateItem.vue";

interface Props {
  widget: DateWidgetProps;
  contents: DateWidgetContents[];
}

defineProps<Props>();
</script>
