<template>
  <div
    class="grid grid-cols-[1fr,auto] md:grid-cols-[auto,1fr] items-center md:items-start gap-4">
    <div
      class="size-16 md:size-24 lg:size-48 xl:size-xs bg-black/10 rounded-lg overflow-hidden order-2 md:order-1 flex items-center justify-center">
      <img
        v-if="previewImgSrc"
        :src="previewImgSrc"
        class="w-full h-full object-cover" />
      <p v-else class="text-xs">No image yet</p>
    </div>
    <div class="order-1 md:order-2">
      <header class="md:mb-4">
        <h1 class="text-xs md:text-base font-bold uppercase text-black/25">
          {{ asset.assetId ? "Edit Asset" : "Create Asset" }}
        </h1>
        <h2 class="text-xl md:text-2xl font-bold">
          {{ asset.title?.[0] || asset.assetId || "New Asset" }}
        </h2>
      </header>
      <div
        v-if="asset && template"
        class="widget-list gap-4 max-h-lg overflow-y-auto hidden lg:grid xl:grid-cols-2">
        <Widget
          v-for="widget in previewWidgets"
          :key="widget.widgetDef.widgetId"
          :widget="widget.widgetDef"
          :asset="asset"
          class="text-sm" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { getThumbURL } from "@/helpers/displayUtils";
import * as Types from "@/types";
import { computed } from "vue";
import Widget from "@/components/Widget/Widget.vue";
import { isEmpty } from "ramda";

const props = defineProps<{
  asset: Types.Asset | Types.UnsavedAsset;
  template: Types.Template;
}>();

const previewImgSrc = computed(() => {
  const fileHandlerId = props.asset.firstFileHandlerId as
    | string
    | undefined
    | null;
  return fileHandlerId ? getThumbURL(fileHandlerId) : null;
});

const sortedPreviewableWidgetDefs = computed(() => {
  return (
    props.template.widgetArray
      // only previewable widgets
      .filter((widgetDef) => {
        return widgetDef.displayInPreview;
      })
      // sort by `viewOrder`
      .sort((a, b) => {
        return a.viewOrder - b.viewOrder;
      })
  );
});

const widgetLookupByFieldTitle = computed(
  (): Record<string, Types.WithId<Types.WidgetContent>[]> => {
    const fieldTitles = sortedPreviewableWidgetDefs.value.map(
      (widgetDef) => widgetDef.fieldTitle
    );

    const lookup = Object.fromEntries(
      fieldTitles.map((fieldTitle) => {
        const widgetContents = (props.asset[fieldTitle] ??
          []) as Types.WithId<Types.WidgetContent>[];
        return [fieldTitle, widgetContents];
      })
    );

    return lookup;
  }
);

const previewWidgets = computed(() => {
  return sortedPreviewableWidgetDefs.value
    .map((widgetDef) => {
      const fieldTitle = widgetDef.fieldTitle;
      const widgetContents = widgetLookupByFieldTitle.value[fieldTitle];
      return {
        widgetDef,
        widgetContents,
      };
    })
    .filter((widget) => {
      if (!widget.widgetContents.length) {
        return false;
      }

      // must have some content in the primary (or first) item
      const primaryContentItem =
        widget.widgetContents.filter((content) => content.isPrimary)[0] ||
        widget.widgetContents[0];

      // primary content item must have a value in some key
      // that's not `isPrimary` or `id`
      const hasValue = Object.keys(primaryContentItem).some((key) => {
        return (
          key !== "isPrimary" &&
          key !== "id" &&
          primaryContentItem[key] !== undefined &&
          primaryContentItem[key] !== null &&
          primaryContentItem[key] !== "" &&
          !isEmpty(primaryContentItem[key])
        );
      });

      return hasValue;
    });
});
</script>
<style scoped></style>
