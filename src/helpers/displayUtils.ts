import { partition } from "ramda";
import { Asset, WidgetProps, WidgetContent, Template } from "@/types";
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

export const getTinyURL = (fileObjectId: string): string =>
  `${config.instance.base.url}/fileManager/tinyImageByFileId/${fileObjectId}/true`;

export const getThumbURL = (fileObjectId: string): string =>
  `${config.instance.base.url}/fileManager/previewImageByFileId/${fileObjectId}/true`;

export const getAssetUrl = (assetId: string): string =>
  `/asset/viewAsset/${assetId}`;

/**
 * selects widget contents from an asset
 * sorts so that primary is first
 */
export function getWidgetContents<
  T extends WidgetProps,
  U extends WidgetContent
>({ asset, widget }: { asset: Asset; widget: T }): U[] | null {
  const widgetContents = asset[widget.fieldTitle] as U[] | undefined;

  if (!widgetContents) return null;

  // `partition(testFn, array)` will split a given array into two arrays
  // based on the test function that's passed in. If testFn is true
  // for an item, the item will be in the first array, otherwise the second
  // it's like filter, but the failing items are in a second array
  // instead of being excluded
  // see: https://ramdajs.com/docs/#partition
  const [primaryWidgetContents, nonPrimaryWidgetContents] = partition<U>(
    (content) => !!content.isPrimary,
    widgetContents
  );

  return [...primaryWidgetContents, ...nonPrimaryWidgetContents];
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
    widgetContents?.length === 1
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
  const title = asset?.title?.[0] ?? "(No Title)";
  return stripTags(title);
}

export function stripTags(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

export function toClickToSearchUrl(
  linkText: string,
  widgetProps: WidgetProps
): string {
  const cleanedLinkText = linkText.trim().replace("?", "").replace("...", "");

  if (widgetProps.clickToSearchType === 0) {
    return (
      config.instance.base.url +
      "/search/querySearch/" +
      stripTags(cleanedLinkText)
    );
  }

  return (
    config.instance.base.url +
    "/search/scopedQuerySearch/" +
    widgetProps.fieldTitle +
    "/" +
    encodeURIComponent(cleanedLinkText)
  );
}
