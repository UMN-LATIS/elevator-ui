<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <ul class="flex gap-2 flex-wrap">
        <li v-for="(tag, index) in content.tags" :key="index">
          <ClickToSearchLink
            v-slot="{ isClickable }"
            :linkText="tag"
            :widget="widget">
            <Chip
              :class="{
                'chip--is-clickable border border-primary  bg-primary-container text-primary cursor-pointer hover:bg-primary hover:text-on-primary transition-colors ease-in-out':
                  isClickable,
              }">
              {{ tag }}
            </Chip>
          </ClickToSearchLink>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { TagListWidgetDef, TagListWidgetContent } from "@/types";
import Chip from "@/components/Chip/Chip.vue";
import ClickToSearchLink from "@/components/ClickToSearchLink/ClickToSearchLink.vue";

defineProps<{
  widget: TagListWidgetDef;
  contents: TagListWidgetContent[];
}>();
</script>
