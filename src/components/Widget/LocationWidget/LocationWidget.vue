<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <LocationItem :widget="widget" :locationContent="content"></LocationItem>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { LocationTemplateWidgetProps, LocationWidgetContent } from "@/types";
import LocationItem from "./LocationItem.vue";

interface Props {
  widget: LocationTemplateWidgetProps;
  contents: LocationWidgetContent[];
}

defineProps<Props>();
</script>
