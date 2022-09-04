<template>
  <ul>
    <template v-for="(content, key) in contents" :key="key">
      <SelectItem :selectValues="content" :widget="widget"></SelectItem>
    </template>
  </ul>
</template>

<script setup lang="ts">
import SelectItem from "./SelectItem.vue";
import { SelectWidgetProps, SelectWidgetContents } from "@/types";

interface Props {
  widget: SelectWidgetProps;
  contents: SelectWidgetContents[];
}

defineProps<Props>();
</script>
