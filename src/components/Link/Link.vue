<template>
  <span v-if="props.widget.clickToSearch">
    <a :href="linkURL">
      <slot />
    </a>
  </span>
  <span v-else>
    <slot />
  </span>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { WidgetProps } from "@/types";
import config from "@/config";

interface Props {
  widget: WidgetProps;
  linkText: string;
}

const props = defineProps<Props>();

const linkURL = computed(() => {
  const cleanedLinkText = props.linkText
    .trim()
    .replace("?", "")
    .replace("...", "");
  if (props.widget.clickToSearchType == 0) {
    return (
      config.baseUrl +
      "/search/querySearch/" +
      encodeURIComponent(cleanedLinkText)
    );
  } else {
    return (
      config.baseUrl +
      "/search/scopedQuerySearch/" +
      props.widget.fieldTitle +
      "/" +
      encodeURIComponent(cleanedLinkText)
    );
  }
});
</script>
