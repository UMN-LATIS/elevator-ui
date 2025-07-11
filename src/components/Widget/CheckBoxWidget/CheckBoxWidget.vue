<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <CircleCheckIcon v-if="content.fieldContents == true" />
      <span v-else>-</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { WidgetDef, WidgetContent } from "@/types";
import CircleCheckIcon from "@/icons/CircleCheckIcon.vue";

defineProps<{
  widget: WidgetDef;
  contents: WidgetContent[];
}>();
</script>
