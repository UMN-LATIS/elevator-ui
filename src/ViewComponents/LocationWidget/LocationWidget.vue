<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <LocationItem :widget="widget" :locationContent="content"></LocationItem>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { LocationWidgetProps, LocationWidgetContents } from "@/types";
import LocationItem from "@/ViewComponents/LocationWidget/LocationItem.vue";

interface Props {
  widget: LocationWidgetProps;
  contents: LocationWidgetContents[];
}

defineProps<Props>();
</script>
