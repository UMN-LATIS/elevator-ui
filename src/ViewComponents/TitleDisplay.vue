<template>
  <h1 v-if="title">
    <Link :widget="titleWidget" :linkText="title[0]">
      {{ title[0] }}
    </Link>
  </h1>
</template>

<script setup lang="ts">
import { getTitleWidget } from "@/Helpers/displayUtils";
import Link from "@/Helpers/Link/Link.vue";
interface Props {
  asset: any;
}
const props = defineProps<Props>();

const titleWidget = getTitleWidget(props.asset);
const title = props.asset.title || "No Title";
</script>
