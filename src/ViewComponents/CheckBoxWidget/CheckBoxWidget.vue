<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <span
        v-if="content.fieldContents == true"
        class="material-symbols-outlined"
      >
        check_circle
      </span>
      <span
        v-else-if="content.fieldContents == false"
        class="material-symbols-outlined"
      >
        cancel
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { WidgetProps, WidgetContents } from "@/types";

interface Props {
  widget: WidgetProps;
  contents: WidgetContents[];
}

const props = defineProps<Props>();
</script>
