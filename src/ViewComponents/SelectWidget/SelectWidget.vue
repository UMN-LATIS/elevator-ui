<template>
  <ul>
    <template v-for="(content, key) in contents" :key="key">
      <SelectItem :selectValues="content" :widget="widget"></SelectItem>

    </template>
  </ul>
</template>

<script setup lang="ts">
import SelectItem from "./SelectItem.vue"
import { Widget } from "@/types";

interface Props {
  widget: Widget;
  contents: object;
}

const props = defineProps<Props>();



</script>

