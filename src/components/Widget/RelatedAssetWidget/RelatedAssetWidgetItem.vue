<template>
  <div class="related-asset-widget-item">
    <!-- if we're at max nesting depth, just link to the asset -->
    <a
      v-if="getWidgetNestingDepth() > maxWidgetNestingDepth"
      :href="getAssetUrl(assetId)"
    >
      {{ title }}
    </a>

    <!-- otherwise show an accordion -->
    <Accordion
      v-if="getWidgetNestingDepth() <= maxWidgetNestingDepth"
      :label="title"
    >
      <WidgetList :assetId="assetId" />
    </Accordion>
  </div>
</template>
<script setup lang="ts">
import { inject } from "vue";
import Accordion from "@/components/Accordion/Accordion.vue";
import WidgetList from "@/components/WidgetList/WidgetList.vue";
import { getAssetUrl } from "@/helpers/displayUtils";
import { getWidgetNestingDepthProviderKey } from "@/constants";

defineProps<{
  assetId: string;
  title: string;
}>();

const maxWidgetNestingDepth = 1;
const getWidgetNestingDepth = inject(getWidgetNestingDepthProviderKey, () => 0);
</script>
<style scoped></style>
