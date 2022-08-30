<template>
  <h1 v-if="title">
    <!-- FIXME: TS Errors -->
    <Link :widget="titleWidget" :linkText="title[0]">
      {{ title[0] }}
    </Link>
  </h1>
</template>

<script setup lang="ts">
import { getTitleWidget } from "@/Helpers/displayUtils";
import Link from "@/Helpers/Link/Link.vue";
import { Asset } from "@/types";

const props = defineProps<{
  asset: Asset;
}>();

const titleWidget = await getTitleWidget(props.asset);
const title = props.asset.title || "No Title";
</script>
