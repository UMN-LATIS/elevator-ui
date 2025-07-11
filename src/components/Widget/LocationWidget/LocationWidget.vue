<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <LocationItem :widget="widget" :locationContent="content"></LocationItem>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { LocationWidgetDef, LocationWidgetContent } from "@/types";
import LocationItem from "./LocationItem.vue";

interface Props {
  widget: LocationWidgetDef;
  contents: LocationWidgetContent[];
}

defineProps<Props>();
</script>
