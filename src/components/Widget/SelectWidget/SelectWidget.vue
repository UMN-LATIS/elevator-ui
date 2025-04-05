<template>
  <ul>
    <template v-for="(content, key) in contents" :key="key">
      <SelectItem :selectValues="content" :widget="widget"></SelectItem>
    </template>
  </ul>
</template>

<script setup lang="ts">
import SelectItem from "./SelectItem.vue";
import { SelectTemplateWidgetProps, SelectWidgetContent } from "@/types";

interface Props {
  widget: SelectTemplateWidgetProps;
  contents: SelectWidgetContent[];
}

defineProps<Props>();
</script>
