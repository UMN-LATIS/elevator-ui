<template>
  <div
    class="related-asset-preview grid grid-cols-[auto,minmax(0,1fr)] gap-2 w-full overflow-hidden">
    <LazyLoadImage
      v-if="imgSrc"
      :src="imgSrc"
      :alt="title"
      class="size-16 app-object-fit rounded-sm overflow-hidden" />
    <div
      v-else
      class="h-8 w-8 sm:h-16 sm:w-16 border border-outline-variant bg-surface-container-lowest rounded-sm" />
    <div>
      <h1 class="font-bold text-md sm:text-lg leading-tight">
        {{ title }}
      </h1>
      <p
        class="text-xs font-mono max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
        {{ assetPreview.objectId }}
      </p>

      <dl
        v-if="props.assetPreview?.entries"
        class="max-h-16 overflow-hidden flex gap-x-2 items-baseline flex-wrap leading-none">
        <div
          v-for="(entry, index) in props.assetPreview.entries"
          :key="index"
          class="inline-flex items-baseline gap-x-2 flex-wrap text-on-surface-variant">
          <dt class="text-xs uppercase">
            {{ entry?.label || "Item" }}
          </dt>
          <dd class="text-sm">
            {{ entry.entries?.join(", ") }}
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
<script setup lang="ts">
import { AssetPreview } from "@/types";
import { getThumbURL, convertHtmlToText } from "@/helpers/displayUtils";
import { computed } from "vue";
import LazyLoadImage from "@/components/LazyLoadImage/LazyLoadImage.vue";

const props = withDefaults(
  defineProps<{
    assetPreview: AssetPreview;
    includeDetails?: boolean;
  }>(),
  {
    includeDetails: false,
  }
);

const title = computed(() => {
  if (Array.isArray(props.assetPreview.title)) {
    return props.assetPreview.title.map(convertHtmlToText).join(",");
  }

  if (props.assetPreview.title && props.assetPreview.title.length > 0) {
    return convertHtmlToText(props.assetPreview.title);
  }

  return "(no title)";
});

const imgSrc = computed(() => {
  const { primaryHandlerId } = props.assetPreview;
  return primaryHandlerId ? getThumbURL(primaryHandlerId) : null;
});
</script>
<style scoped></style>
