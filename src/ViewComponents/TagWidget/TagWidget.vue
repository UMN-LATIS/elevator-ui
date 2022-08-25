<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <ul class="taglist">
        <li v-for="tag in content.tags" :key="tag">
          <Link :widget="widget" :linkText="tag">{{ tag }} </Link>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script setup lang="ts">
import Link from "@/Helpers/Link/Link.vue";
import { Widget, WidgetContents } from "@/types";

interface Props {
  widget: Widget;
  contents: WidgetContents[];
}

const props = defineProps<Props>();
</script>

<style scoped>
.taglist {
  display: inline;
  list-style: none;
  margin: 0;
  padding: 0;
}

.taglist li {
  display: inline;
}

.taglist li + li:before {
  content: ", ";
}
</style>
