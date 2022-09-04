<!-- todo: need to add text truncation, maybe with a show more modal -->
<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <TextAreaItem
        :widget="widget"
        :fieldContents="content.fieldContents ?? ''"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { TextAreaWidgetProps, TextAreaWidgetContents } from "@/types";
import TextAreaItem from "./TextAreaItem.vue";

defineProps<{
  widget: TextAreaWidgetProps;
  contents: TextAreaWidgetContents[];
}>();
</script>
