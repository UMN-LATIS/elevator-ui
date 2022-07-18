<!-- todo need to fix all the hover state stuff, decide if that matters-->
<template>
  <p><strong>{{ widget.label }}:</strong></p>
  <ul class="imageList">
    <li v-for="(content, key) in contents" :key="key">
      <div class="imageContainer">
        <UploadItem :content="content" :widget="widget" class="squareItem" />
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { Widget, WidgetContents } from "@/types";
import UploadItem from "@/ViewComponents/UploadWidget/UploadItem.vue";

interface Props {
  widget: Widget;
  contents: WidgetContents[];
}

const props = defineProps<Props>();
</script>


<style scoped>
.squareItem {
  width: 100px;
  height: 100px;
  object-fit: cover;
}

.squareItem:hover {
  width: 200px;
  height: 200px;
  position: absolute;
  top: -100px;
  left: -50px;
  z-index: 100;
  object-fit: contain;
}

ul {
  display: block;
}

ul li+li:before {
  content: none;
}

.imageContainer {
  position: relative;
  width: 100px;
  height: 100px;
  display: inline;

}
</style>