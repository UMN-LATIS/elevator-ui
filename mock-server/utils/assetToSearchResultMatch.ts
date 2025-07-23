import {
  Asset,
  SearchResultMatch,
  DateResult,
  LocationObject,
  UploadWidgetContent,
  DateWidgetContent,
  LocationWidgetContent,
  AssetCollection,
  Template,
} from "../../src/types";

function extractDatesFromAsset(asset: Asset): DateResult[] {
  const dates: DateResult[] = [];
  Object.keys(asset).forEach((key) => {
    if (key.startsWith("date_") && Array.isArray(asset[key])) {
      const dateWidgets = asset[key] as DateWidgetContent[];
      dateWidgets.forEach((dateWidget) => {
        if (dateWidget.start) {
          dates.push({
            start: {
              text: dateWidget.start.text || "",
              numeric: BigInt(dateWidget.start.numeric || "0"),
            },
            end: dateWidget.end
              ? {
                  text: dateWidget.end.text || "",
                  numeric: BigInt(dateWidget.end.numeric || "0"),
                }
              : undefined,
            label: dateWidget.label,
            isPrimary: dateWidget.isPrimary,
            dateAsset: [
              {
                start: {
                  text: dateWidget.start.text || "",
                  numeric: dateWidget.start.numeric || 0,
                },
                end: dateWidget.end
                  ? {
                      text: dateWidget.end.text || "",
                      numeric: dateWidget.end.numeric || 0,
                    }
                  : undefined,
                label: dateWidget.label,
                isPrimary: dateWidget.isPrimary,
              },
            ],
          });
        }
      });
    }
  });
  return dates;
}

function extractLocationsFromAsset(asset: Asset): LocationObject[] {
  const locations: LocationObject[] = [];
  Object.keys(asset).forEach((key) => {
    if (key.startsWith("location_") && Array.isArray(asset[key])) {
      const locationWidgets = asset[key] as LocationWidgetContent[];
      locationWidgets.forEach((locationWidget) => {
        if (locationWidget.loc) {
          locations.push({
            label: locationWidget.locationLabel || undefined,
            ...locationWidget.loc,
          });
        }
      });
    }
  });
  return locations;
}

interface FileAssetsInfo {
  count: number;
  primaryHandlerId: string | null;
  primaryHandlerType: string | undefined;
}

function extractFileAssetsFromAsset(asset: Asset): FileAssetsInfo {
  let count = 0;
  let primaryHandlerId: string | null = null;
  let primaryHandlerType: string | undefined;

  Object.keys(asset).forEach((key) => {
    if (key.startsWith("upload_") && Array.isArray(asset[key])) {
      const uploadWidgets = asset[key] as UploadWidgetContent[];
      count += uploadWidgets.length;

      // Find primary handler
      const primaryUpload = uploadWidgets.find((upload) => upload.isPrimary);
      if (primaryUpload) {
        primaryHandlerId = primaryUpload.fileId;
        primaryHandlerType = primaryUpload.fileType;
      } else if (uploadWidgets.length > 0 && !primaryHandlerId) {
        // Fallback to first upload if no primary found
        primaryHandlerId = uploadWidgets[0].fileId;
        primaryHandlerType = uploadWidgets[0].fileType;
      }
    }
  });

  return {
    count,
    primaryHandlerId: primaryHandlerId || asset.firstFileHandlerId || null,
    primaryHandlerType,
  };
}

function generateThumbnailUrls(primaryHandlerId: string | null) {
  if (!primaryHandlerId) {
    return {
      tiny: undefined,
      tiny2x: undefined,
      thumbnail: undefined,
      thumbnail2x: undefined,
    };
  }

  return {
    tiny: `/api/files/${primaryHandlerId}/tiny`,
    tiny2x: `/api/files/${primaryHandlerId}/tiny2x`,
    thumbnail: `/api/files/${primaryHandlerId}/thumbnail`,
    thumbnail2x: `/api/files/${primaryHandlerId}/thumbnail2x`,
  };
}

export function assetToSearchResultMatch({
  asset,
  collection,
  template,
}: {
  asset: Asset;
  collection: AssetCollection;
  template: Template;
}): SearchResultMatch {
  const collectionHierarchy = collection
    ? [{ id: collection.id, title: collection.title }]
    : [];

  // Get template info
  const templateEntry = template
    ? { id: template.templateId, name: template.templateName }
    : { id: asset.templateId, name: `Template ${asset.templateId}` };

  // Extract data using helper functions
  const title = asset.title || null;
  const dates = extractDatesFromAsset(asset);
  const locations = extractLocationsFromAsset(asset);
  const fileAssets = extractFileAssetsFromAsset(asset);
  const thumbnailUrls = generateThumbnailUrls(fileAssets.primaryHandlerId);

  return {
    title,
    dates,
    locations,
    objectId: asset.assetId,
    lastModified: asset.modified?.date,
    collectionHierarchy,
    template: templateEntry,
    fileAssets: fileAssets.count > 0 ? fileAssets.count : undefined,
    primaryHandlerId: fileAssets.primaryHandlerId,
    primaryHandlerType: fileAssets.primaryHandlerType,
    primaryHandlerTiny: thumbnailUrls.tiny,
    primaryHandlerTiny2x: thumbnailUrls.tiny2x,
    primaryHandlerThumbnail: thumbnailUrls.thumbnail,
    primaryHandlerThumbnail2x: thumbnailUrls.thumbnail2x,
    base_url: "/defaultinstance/",
    isChild: false,
    hasChildren: false,
  };
}
