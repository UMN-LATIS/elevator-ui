import { SearchResultMatch, RelatedAssetCacheItemWithId, Asset } from "@/types";
import { reactive } from "vue";
import { getThumbURL, getAssetTitle } from "@/helpers/displayUtils";
import api from "@/api";

export interface Slide {
  id: string;
  objectId: string | undefined;
  title: string | undefined;
  primaryHandlerId: string | null | undefined;
  thumb: {
    src: string | null | undefined;
    alt: string | undefined;
  };
  isChildSlide?: boolean;
  isPlaceholder?: boolean;
  childIndex?: number;
  parentObjectId?: string;
  parentTitle?: string;
  totalChildren?: number;
}

const selectTitleFromMatch = (match: SearchResultMatch) => {
  const noTitleText = "No Title";
  if (Array.isArray(match.title)) {
    return match.title?.[0] ?? noTitleText;
  }
  return match.title ?? noTitleText;
};

const selectThumbSrc = (match: SearchResultMatch) => {
  const { primaryHandlerId } = match;
  return primaryHandlerId ? getThumbURL(primaryHandlerId) : null;
};

const matchToSlide = (match: SearchResultMatch): Slide => ({
  id: match.objectId,
  objectId: match.objectId,
  primaryHandlerId: match.primaryHandlerId ?? null,
  title: selectTitleFromMatch(match),
  thumb: {
    src: selectThumbSrc(match),
    alt: selectTitleFromMatch(match),
  },
});

function createPlaceholderSlidesForChildren(match: SearchResultMatch): Slide[] {
  const { fileAssets, objectId } = match;
  const placeholders: Slide[] = [];

  if (!fileAssets) return placeholders;

  for (let i = 1; i < fileAssets; i++) {
    const placeholder: Slide = {
      id: `${objectId}-placeholder-${i}`,
      objectId: undefined,
      title: undefined,
      primaryHandlerId: undefined,
      thumb: {
        src: undefined,
        alt: undefined,
      },
      isChildSlide: true,
      isPlaceholder: true,
      parentObjectId: objectId,
      parentTitle: selectTitleFromMatch(match),
      childIndex: i,
      totalChildren: fileAssets,
    };
    placeholders.push(placeholder);
  }

  return placeholders;
}

function convertRelatedAssetToSlide(
  relatedAsset: RelatedAssetCacheItemWithId
): Slide {
  const {
    id: objectId,
    relatedAssetTitle,
    primaryHandler: primaryHandlerId,
  } = relatedAsset;

  const title = Array.isArray(relatedAssetTitle)
    ? relatedAssetTitle[0]
    : relatedAssetTitle ?? "No Title";

  return {
    id: `${objectId}-related-asset`,
    objectId,
    title,
    primaryHandlerId,
    thumb: {
      src: primaryHandlerId ? getThumbURL(primaryHandlerId) : null,
      alt: title,
    },
  };
}

function convertFileToSlide({
  fileId,
  parentObjectId,
  parentTitle,
}: {
  fileId: string;
  parentObjectId: string;
  parentTitle: string;
}): Slide {
  return {
    id: `${parentObjectId}-file-${fileId}`,
    objectId: parentObjectId,
    title: parentTitle,
    primaryHandlerId: fileId,
    thumb: {
      src: fileId ? getThumbURL(fileId) : null,
      alt: parentTitle,
    },
  };
}

type ChildFileObject = { fileId: string; [key: string]: unknown };

function selectFileObjectsWithinAsset(asset: Asset): ChildFileObject[] {
  const childFiles: ChildFileObject[] = [];

  const isFileObject = (obj) => obj && typeof obj === "object" && obj.fileId;

  // for each widget, if it's an array, check each item in the array
  // for a `fileId` property
  Object.values(asset).forEach((widget) => {
    if (!Array.isArray(widget)) return;
    widget.forEach((widgetItem) => {
      if (isFileObject(widgetItem)) {
        childFiles.push(widgetItem);
      }
    });
  });

  return childFiles;
}

function selectRelatedAssets(asset: Asset): RelatedAssetCacheItemWithId[] {
  const relatedAssetWithId: RelatedAssetCacheItemWithId[] = [];

  if (!asset.relatedAssets) return relatedAssetWithId;

  for (const [id, relatedAsset] of Object.entries(asset.relatedAssets)) {
    relatedAssetWithId.push({ ...relatedAsset, id });
  }

  return relatedAssetWithId;
}

async function fetchChildSlides(parentObjectId: string): Promise<Slide[]> {
  const asset = await api.getAsset(parentObjectId);

  if (!asset) {
    throw new Error("Asset not found. Cannot fetch child slides.");
  }

  const filesWithinAsset = selectFileObjectsWithinAsset(asset);
  const relatedAssets = selectRelatedAssets(asset);

  const childFilesWithParentInfo = filesWithinAsset
    // filter out the primary file -- only children allows
    .filter((file) => !file.isPrimary)
    // add parent info to each file
    .map((file) => ({
      fileId: file.fileId,
      parentObjectId,
      parentTitle: getAssetTitle(asset),
    }));

  return [
    ...childFilesWithParentInfo.map(convertFileToSlide),
    ...relatedAssets.map(convertRelatedAssetToSlide),
  ];
}

export function useSlidesForMatches(matches: SearchResultMatch[]): Slide[] {
  const slides = reactive<Array<Slide>>([]);
  matches.forEach((match) => {
    const slide = matchToSlide(match);

    // add the parent slide to the slides array
    slides.push(slide);

    // if there are children, add a placeholder slide for each child
    const placeholdersForChildren = createPlaceholderSlidesForChildren(match);

    slides.push(...placeholdersForChildren);

    // now, we queue up a featch for child slide data
    // which we'll use to replace the placeholder slides
    fetchChildSlides(match.objectId).then((childSlides) => {
      childSlides.forEach((childSlide, index) => {
        const { id: placeholderSlideId } = placeholdersForChildren[index];
        const indexOfPlaceholder = slides.findIndex(
          (slide) => slide.id === placeholderSlideId
        );
        console.log("index of placeholder", indexOfPlaceholder);
        slides[indexOfPlaceholder] = childSlide;
      });
    });
  });

  // returns data in slide format for each search result
  return slides;
}
