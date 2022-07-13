<!-- todo: need to add text truncation, maybe with a show more modal -->
<template>
  <p><strong>{{ widget.label }}:</strong></p>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <span v-html="content.fieldContents"> </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import Link from "@/Helpers/Link/Link.vue";
import { Widget, WidgetContents } from "@/types";


interface Props {
  widget: Widget;
  contents: WidgetContents[];
}

const props = defineProps<Props>();

</script>
