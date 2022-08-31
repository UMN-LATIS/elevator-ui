<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <Link :widget="widget" :linkText="content.fieldContents"
        ><span v-html="autolinkText(content.fieldContents)"></span
      ></Link>
    </li>
  </ul>
</template>

<script setup lang="ts">
import Link from "@/Helpers/Link/Link.vue";
import { TextWidget, TextWidgetContents } from "@/types";

interface Props {
  widget: TextWidget;
  contents: TextWidgetContents[];
}

const props = defineProps<Props>();

function autolinkText(text: string): string {
  const textWithStrippedTags = text.replace(/(<([^>]+)>)/gi, "");
  // if this text contains tags, just leave it as is
  if (textWithStrippedTags != text) {
    return text;
  } else {
    //otherwise, try to autolink urls
    return text.replace(
      /(https?:\/\/[a-zA-Z0-9\-_.:@!~*'(¥);/?&=+$,%#]+)/g,
      '<a href="$1" target="_blank">$1</a>'
    );
  }
}
</script>
