import { SearchResultMatch, RelatedAssetCacheItemWithId, Asset } from "@/types";
import { reactive } from "vue";
import {
  getThumbURL,
  getAssetTitle,
  convertHtmlToText,
} from "@/helpers/displayUtils";
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
  if (Array.isArray(match.title)) {
    return match.title.map(convertHtmlToText).join(", ");
  }
  return match.title?.length ? convertHtmlToText(match.title) : "(No Title)";
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

  const childFileCount = fileAssets - 1; // subtract 1 for the primary file
  for (let i = 0; i < childFileCount; i++) {
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
      totalChildren: childFileCount,
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
  return Object.entries(asset?.relatedAssetCache ?? {})
    .filter(([, relatedAsset]) => relatedAsset != null) // Filter out null/undefined values
    .map(([id, relatedAsset]) => ({
      ...relatedAsset,
      id,
    }) as RelatedAssetCacheItemWithId);
}

async function fetchChildSlides(parentObjectId: string): Promise<Slide[]> {
  const asset = await api.getAsset(parentObjectId);

  if (!asset) {
    throw new Error("Asset not found. Cannot fetch child slides.");
  }

  const filesWithinAsset = selectFileObjectsWithinAsset(asset);
  const relatedAssetsWithId = selectRelatedAssets(asset);

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
    ...relatedAssetsWithId.map(convertRelatedAssetToSlide),
  ];
}

export function useSlidesForMatches(matches: SearchResultMatch[]): {
  slides: Slide[];
  createSlidesForMatch: (match: SearchResultMatch) => void;
} {
  const slides = reactive<Array<Slide>>([]);

  function createSlidesForMatch(match: SearchResultMatch) {
    const slide = matchToSlide(match);

    // add the parent slide to the slides array
    slides.push(slide);

    // if there are children, add a placeholder slide for each child
    const placeholdersForChildren = createPlaceholderSlidesForChildren(match);

    slides.push(...placeholdersForChildren);

    // now, we queue up a fetch for child slide data
    // which we'll use to replace the placeholder slides
    fetchChildSlides(match.objectId).then((childSlides) => {
      // Replace placeholders with child files (first N slides where N = number of placeholders)
      placeholdersForChildren.forEach((placeholder, index) => {
        const childSlide = childSlides[index];
        if (!childSlide) {
          throw new Error(
            "Child slide not found, cannot replace placeholder. There may be a mismatch between the number of placeholders and the number of child slides."
          );
        }

        const indexOfPlaceholder = slides.findIndex(
          (slide) => slide.id === placeholder.id
        );
        slides[indexOfPlaceholder] = childSlide;
      });

      // If there are more child slides than placeholders (e.g., related assets),
      // append them after the last placeholder for this match
      if (childSlides.length > placeholdersForChildren.length) {
        const remainingChildSlides = childSlides.slice(
          placeholdersForChildren.length
        );

        // Find the index of the last placeholder for this match
        const lastPlaceholder =
          placeholdersForChildren[placeholdersForChildren.length - 1];
        const lastPlaceholderIndex = slides.findIndex(
          (slide) => slide.id === lastPlaceholder.id
        );

        // Insert remaining child slides after the last placeholder
        slides.splice(lastPlaceholderIndex + 1, 0, ...remainingChildSlides);
      }
    });
  }

  matches.forEach((match) => {
    createSlidesForMatch(match);
  });

  return { slides, createSlidesForMatch };
}
