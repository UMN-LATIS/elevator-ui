<!-- todo need to fix all the hover state stuff, decide if that matters-->
<template>
  <ul class="imageList">
    <li v-for="(content, key) in contents" :key="key">
      <div class="imageContainer">
        <UploadWidgetItem
          :content="content"
          :widget="widget"
          class="squareItem"
        />
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { UploadWidgetProps, UploadWidgetContents } from "@/types";
import UploadWidgetItem from "./UploadWidgetItem.vue";

defineProps<{
  widget: UploadWidgetProps;
  contents: UploadWidgetContents[];
}>();
</script>
