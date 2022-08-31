<template>
  <h1 v-if="title">
    <!-- FIXME: TS Errors -->
    <Link v-if="titleWidget" :widget="titleWidget" :linkText="title">
      {{ title }}
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
const title = props.asset.titleObject || "No Title";
</script>
