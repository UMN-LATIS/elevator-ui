<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <span class="material-icons" v-if="content.fieldContents == true">
        check_circle
      </span>
      <span class="material-icons" v-else-if="content.fieldContents == false">
        cancel
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { Widget, WidgetContents } from "@/types";

interface Props {
  widget: Widget;
  contents: WidgetContents[];
}

const props = defineProps<Props>();
</script>
