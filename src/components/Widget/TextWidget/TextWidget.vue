<template>
  <ul>
    <li v-for="(content, key) in contents" :key="key">
      <ClickToSearchLink
        v-if="content.fieldContents"
        :widget="widget"
        :linkText="content.fieldContents">
        <span v-html="autolinkText(content.fieldContents)"></span>
      </ClickToSearchLink>
      <span v-else>-</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import ClickToSearchLink from "@/components/ClickToSearchLink/ClickToSearchLink.vue";
import { TextWidgetDef, TextWidgetContent } from "@/types";

defineProps<{
  widget: TextWidgetDef;
  contents: TextWidgetContent[];
}>();

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
