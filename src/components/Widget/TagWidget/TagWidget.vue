<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <ul class="flex gap-2">
        <li v-for="(tag, index) in content.tags" :key="index">
          <ClickToSearchLink
            v-slot="{ isClickable }"
            :linkText="tag"
            :widget="widget"
          >
            <Chip
              :class="{
                'chip--is-clickable border border-blue-700  bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-700 hover:text-white transition-colors ease-in-out':
                  isClickable,
              }"
            >
              {{ tag }}
            </Chip>
          </ClickToSearchLink>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { TagListWidgetProps, TagListWidgetContent } from "@/types";
import Chip from "@/components/Chip/Chip.vue";
import ClickToSearchLink from "@/components/ClickToSearchLink/ClickToSearchLink.vue";

defineProps<{
  widget: TagListWidgetProps;
  contents: TagListWidgetContent[];
}>();
</script>
