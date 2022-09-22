<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <ul class="flex gap-2">
        <li v-for="(tag, index) in content.tags" :key="index">
          <Chip :href="toClickToSearchUrl(tag, widget)">
            {{ tag }}
          </Chip>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { TagListWidgetProps, TagListWidgetContent } from "@/types";
import { toClickToSearchUrl } from "@/helpers/displayUtils";
import Chip from "@/components/Chip/Chip.vue";

defineProps<{
  widget: TagListWidgetProps;
  contents: TagListWidgetContent[];
}>();
</script>
