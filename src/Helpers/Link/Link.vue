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
import { Widget } from "@/types";
import { getBaseURL } from "@/Helpers/displayUtils";

interface Props {
  widget: Widget;
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
      getBaseURL() + "search/querySearch/" + encodeURIComponent(cleanedLinkText)
    );
  } else {
    return (
      getBaseURL() +
      "search/scopedQuerySearch/" +
      props.widget.fieldTitle +
      "/" +
      encodeURIComponent(cleanedLinkText)
    );
  }
});
</script>
