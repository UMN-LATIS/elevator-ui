<template>
  <ul>
    <template v-for="(content, key) in contents" :key="key">
      <!-- FIX ME! -->
      <!-- <SelectItem :selectValues="content" :widget="widget"></SelectItem> -->
    </template>
  </ul>
</template>

<script setup lang="ts">
import SelectItem from "./SelectItem.vue";
import { SelectWidget, SelectWidgetContents } from "@/types";

interface Props {
  widget: SelectWidget;
  contents: SelectWidgetContents;
}

defineProps<Props>();
</script>
