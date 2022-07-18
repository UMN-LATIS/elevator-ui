<template>
  <p><strong>{{ widget.label }}:</strong></p>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <LocationItem :widget="widget" :locationContent="content"></LocationItem>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { Widget, WidgetContents } from "@/types";
import LocationItem from "@/ViewComponents/LocationWidget/LocationItem.vue";

interface Props {
  widget: Widget;
  contents: WidgetContents[];
}

const props = defineProps<Props>();



</script>
