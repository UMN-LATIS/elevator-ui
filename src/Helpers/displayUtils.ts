import axios from "axios";
import { useTemplateStore } from "@/stores/templateStore";
import { useAssetStore } from "@/stores/assetStore";
import {
  Asset,
  TextWidgetProps,
  WidgetProps,
  WidgetContents,
  Template,
} from "@/types";
import config from "@/config";

export function getWidgetPropsByFieldTitle<T extends WidgetProps>(
  template: Template,
  fieldTitle: string
): T | null {
  return (
    (template.widgetArray as T[]).find(
      (widget: T) => widget.fieldTitle === fieldTitle
    ) ?? null
  );
}

export const getTinyURL = (fileObjectId) => {
  return (
    config.baseUrl +
    "/fileManager/getDerivativeById/" +
    fileObjectId +
    "/tiny2x"
  );
};

export const getThumbURL = (fileObjectId) => {
  return (
    config.baseUrl +
    "/fileManager/getDerivativeById/" +
    fileObjectId +
    "/thumbnail2x"
  );
};

export const getAssetUrl = (assetId: string) => {
  return config.baseUrl + "/asset/viewAsset/" + assetId;
};

export const getRelatedAssetTitle = (relatedAssetTitleCache) => {
  if (relatedAssetTitleCache && relatedAssetTitleCache.length > 0) {
    return relatedAssetTitleCache[0];
  } else {
    return "(no title)";
  }
};

export const getAsset = (assetId: string): Promise<Asset> => {
  return axios
    .get(config.baseUrl + "/asset/viewAsset/" + assetId + "/true")
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      // todo
      alert(err);
    });
};

// const assetStore = useAssetStore();
// export const setAssetInStore = (
//   fileObjectId: string,
//   objectId: string | null
// ) => {
//   assetStore.fileObjectId = fileObjectId;
//   if (objectId) {
//     assetStore.objectId = objectId;
//   } else {
//     assetStore.objectId = null;
//   }
// };

export const getTemplate = (templateId: string | number) => {
  return axios
    .get(config.baseUrl + "/assetManager/getTemplate/" + templateId)
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      // todo
      alert(err);
    });
};

// export const getTitleWidget = async (
//   asset: Asset
// ): Promise<TextWidgetProps | null> => {
//   const templateStore = useTemplateStore();
//   const template = await templateStore.loadTemplate(asset.templateId);

//   if (!asset.titleObject) {
//     return null;
//   }

//   return getWidgetPropsByFieldTitle<TextWidgetProps>(
//     template,
//     asset.titleObject
//   );
// };

export function getWidgetContents<
  T extends WidgetProps,
  U extends WidgetContents
>({ asset, widget }: { asset: Asset; widget: T }) {
  return asset[widget.fieldTitle] as U[];
}

/**
 * determines if a widget matches the asset title,
 * so that we can skip rendering it as it will be duplicated
 */
export function widgetMatchesTitleWidget({
  widget,
  template,
  asset,
}: {
  widget: WidgetProps;
  template: Template | null;
  asset: Asset | null;
}): boolean {
  // if no titleObject, then this widget doesn't match
  if (!asset || !template || !asset.titleObject) return false;

  const titleWidget = getWidgetPropsByFieldTitle(template, asset.titleObject);
  const widgetContents = getWidgetContents({ asset: asset, widget });

  return (
    !!titleWidget &&
    widget.type === "text" &&
    widget.fieldTitle === titleWidget.fieldTitle &&
    widgetContents.length === 1
  );
}

export function assetHasWidgetContents({
  asset,
  widget,
}: {
  asset: Asset;
  widget: WidgetProps;
}) {
  const contents = getWidgetContents({ asset, widget });
  return contents !== null && contents !== undefined;
}

export function getWidgetsForDisplay({
  asset,
  template,
}: {
  asset: Asset | null;
  template: Template | null;
}): WidgetProps[] {
  if (!(template && asset)) return [];

  const filteredWidgets = template.widgetArray
    .filter((widget) => widget.display)
    .filter((widget) => assetHasWidgetContents({ asset, widget }));

  // if there's less than 2 items, we're done
  // as there's nothing to be sorted
  if (filteredWidgets.length < 2) {
    return filteredWidgets;
  }

  // otherwise, remove any widgets that might be a duplicate
  // with the asset title and then sort
  return filteredWidgets
    .filter((widget) => !widgetMatchesTitleWidget({ widget, template, asset }))
    .sort((a, b) => a.viewOrder - b.viewOrder);
}

export function getAssetTitle(asset: Asset): string {
  return asset?.title?.[0] ?? "(No Title)";
}
