import { SearchResultMatch, RelatedAssetCacheItemWithId } from "@/types";
import { reactive } from "vue";
import { getThumbURL } from "@/helpers/displayUtils";
import api from "@/api";

export interface Slide {
  objectId: string | undefined;
  title: string | undefined;
  primaryHandlerId: string | null | undefined;
  thumb: {
    src: string | null | undefined;
    alt: string | undefined;
  };
  isChildSlide?: boolean;
  childIndex?: number;
  parentObjectId?: string;
  parentTitle?: string;
  totalChildren?: number;
}

const slides = reactive<Array<Slide>>([]);

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
      objectId: undefined,
      title: undefined,
      primaryHandlerId: undefined,
      thumb: {
        src: undefined,
        alt: undefined,
      },
      isChildSlide: true,
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
    objectId,
    title,
    primaryHandlerId,
    thumb: {
      src: primaryHandlerId ? getThumbURL(primaryHandlerId) : null,
      alt: title,
    },
  };
}

async function fetchChildSlide(parentObjectId, childIndex): Promise<Slide> {
  const childAssets = await api.getAssetChildren(parentObjectId);
  const childAsset = childAssets[childIndex];

  return convertRelatedAssetToSlide(childAsset);
}

export function useSlidesForMatches(matches: SearchResultMatch[]): Slide[] {
  matches.forEach((match) => {
    const slide = matchToSlide(match);

    // add the parent slide to the slides array
    slides.push(slide);

    // if there are children, add a placeholder slide for each child
    const placeholdersForChildren = createPlaceholderSlidesForChildren(match);
    slides.push(...placeholdersForChildren);

    // finally, for each child, fetch it's real data
    // and replace the placeholder slide with the real slide
    placeholdersForChildren.forEach(async (placeholder) => {
      const { parentObjectId, childIndex } = placeholder;
      const childSlide = await fetchChildSlide(parentObjectId, childIndex);
      slides.splice(slides.indexOf(placeholder), 1, childSlide);
    });
  });

  // returns data in slide format for each search result
  return slides;
}
