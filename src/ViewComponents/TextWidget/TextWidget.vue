<template>
  <p><strong>{{ widget.label }}:</strong></p>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <Link :widget="widget" :linkText="content.fieldContents" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Link from "@/Helpers/Link/Link.vue";
import { Widget, WidgetContents } from "@/types";


interface Props {
  widget: Widget;
  contents: WidgetContents[];
}

const props = defineProps<Props>();

</script>
