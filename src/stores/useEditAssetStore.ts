import { defineStore } from "pinia";
import { computed, ref, toRaw } from "vue";
import {
  WidgetProps,
  WidgetContent,
  type Asset,
  type AssetCollection,
  type Template,
} from "@/types";
import { createDefaultWidgetContent as createDefaultWidgetContents } from "@/helpers/createDefaultWidgetContents";
import { useInstanceStore } from "./instanceStore";
import invariant from "tiny-invariant";

export interface AssetEditStoreState {
  asset: Asset | null;
  template: Template | null;
  originalAsset: Asset | null;
  errors: Record<string, string[]>;
}

export const useEditAssetStore = defineStore("editAssetForm", () => {
  const instanceStore = useInstanceStore();

  // state
  const asset = ref<Asset | null>(null);
  const template = ref<Template | null>(null);
  const savedAsset = ref<Asset | null>(null);
  const errors = ref<Record<string, string[]>>({});

  // computed
  const collection = computed(() => {
    if (asset.value && asset.value.collectionId) {
      return instanceStore.getCollectionById(asset.value.collectionId);
    }
    return null;
  });

  // actions
  function initAsset(opts: {
    template: Template;
    asset?: Asset;
    collectionId?: AssetCollection["id"];
  }) {
    // clear any errors
    errors.value = {};

    const rawTemplate = toRaw(opts.template);
    // if the template is not a template, throw an error

    // set the template
    template.value = rawTemplate;

    // if we have an asset, set it
    if (opts.asset) {
      const rawAsset = toRaw(opts.asset);
      // use `toRaw` so that we don't have a proxy object
      // and we can use `structuredClone` to deep clone the asset
      savedAsset.value = structuredClone(rawAsset);
      asset.value = rawAsset;
      // widget content a unique id for better reactivity
      for (const widgetDef of template.value.widgetArray) {
        if (!asset.value[widgetDef.fieldTitle]) {
          asset.value[widgetDef.fieldTitle] = [
            createDefaultWidgetContents(widgetDef),
          ];
        }

        for (const widgetContent of asset.value[
          widgetDef.fieldTitle
        ] as WidgetContent[]) {
          if (!widgetContent.id) {
            widgetContent.id = crypto.randomUUID();
          }
        }
      }

      return;
    }

    // make sure we have a colllectionId if this is a new
    // asset
    invariant(
      opts.collectionId,
      "collectionId is required when creating new assets"
    );

    // create the asset
    const initialAsset: Asset = {
      id: `TEMP_ASSET_ID-${Date.now()}`,
      templateId: template.value.templateId,
      readyForDisplay: false,
      collectionId: opts.collectionId,
      availableAfter: null,
      modified: {
        date: new Date().toISOString(),
        timezone_type: 3,
        timezone: "UTC",
      },
      modifiedBy: 0,
      createdBy: 0,
      deletedBy: null,
      relatedAssetCache: null,
      firstFileHandlerId: null,
      firstObjectId: null,
      titleObject: null,
      title: [""],
    };

    // add fields for each widget in the template
    template.value.widgetArray.forEach((widgetDef) => {
      initialAsset[widgetDef.fieldTitle] = [
        createDefaultWidgetContents(widgetDef),
      ];
    });

    asset.value = initialAsset;
  }

  function updateWidgetContents(
    fieldTitle: WidgetProps["fieldTitle"],
    contents: WidgetContent[]
  ) {
    invariant(asset.value);
    asset.value[fieldTitle] = contents;
  }

  function getWidgetContentLookup(): Record<string, WidgetContent[]> {
    invariant(asset.value);
    invariant(template.value);

    const widgetContents: Record<string, WidgetContent[]> = {};

    for (const widgetDef of template.value.widgetArray) {
      const contents = asset.value[widgetDef.fieldTitle] as WidgetContent[];
      if (contents) {
        widgetContents[widgetDef.fieldTitle] = contents;
      }
      // if contents is empty, create a default widget content
      else {
        widgetContents[widgetDef.fieldTitle] = [
          createDefaultWidgetContents(widgetDef),
        ];
      }
    }

    return widgetContents;
  }

  return {
    // state
    asset,
    template,
    savedAsset,
    errors,
    collection,

    // actions
    initAsset,
    updateWidgetContents,
    getWidgetContentLookup,
  };
});
