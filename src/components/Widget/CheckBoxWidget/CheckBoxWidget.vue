<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <CircleCheckIcon v-if="content.fieldContents == true" />
      <CircleIcon v-else />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { WidgetProps, WidgetContent } from "@/types";
import CircleCheckIcon from "@/icons/CircleCheckIcon.vue";
import CircleIcon from "@/icons/CircleIcon.vue";

defineProps<{
  widget: WidgetProps;
  contents: WidgetContent[];
}>();
</script>
