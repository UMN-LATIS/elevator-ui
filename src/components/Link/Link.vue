<template>
  <span v-if="props.widget.clickToSearch">
    <a :href="linkUrl">
      <slot />
    </a>
  </span>
  <span v-else>
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { WidgetProps } from "@/types";
import { toClickToSearchUrl } from "@/helpers/displayUtils";

interface Props {
  linkText: string;
  widget: WidgetProps;
}

const props = defineProps<Props>();

const linkUrl = computed((): string =>
  toClickToSearchUrl(props.linkText, props.widget)
);
</script>
