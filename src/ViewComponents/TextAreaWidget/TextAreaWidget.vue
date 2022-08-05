<!-- todo: need to add text truncation, maybe with a show more modal -->
<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <TextAreaItem :widget="widget" :fieldContents="content.fieldContents" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { Widget, WidgetContents } from "@/types";
import TextAreaItem from "@/ViewComponents/TextAreaWidget/TextAreaItem.vue";

interface Props {
  widget: Widget;
  contents: WidgetContents[];
}

const props = defineProps<Props>();


</script>
