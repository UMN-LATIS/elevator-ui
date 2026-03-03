import type { Component } from "vue";
import {
  TypeIcon,
  AlignLeftIcon,
  ListIcon,
  CheckSquareIcon,
  CalendarIcon,
  TagIcon,
  ListChecksIcon,
  MapPinIcon,
  PaperclipIcon,
  LinkIcon,
} from "lucide-vue-next";

/**
 * Client-side fallback sample field data, keyed by field type name.
 * Used when the server returns null for sampleFieldData (e.g. older API versions).
 * Only types with structured config (non-trivial fieldData) are included here —
 * types like text, checkbox, date etc. don't have configurable field data.
 */
export const FIELD_TYPE_SAMPLE_DATA: Record<string, unknown> = {
  select: {
    multiSelect: false,
    selectGroup: ["option 1", "option 2", "option 3"],
  },
  multiselect: {
    country: {
      usa: {
        state: {
          wisconsin: { city: ["madison", "milwaukee"] },
          minnesota: {
            city: {
              minneapolis: { neighborhood: ["uptown", "downtown"] },
              mankato: { neighborhood: ["campus", "downtown"] },
            },
          },
        },
      },
      canada: {
        state: {
          alberta: { city: ["fakeville", "faketown"] },
          quebec: { city: ["montreal"] },
        },
      },
    },
  },
  upload: {
    extractLocation: true,
    extractDate: true,
    enableTiling: true,
    enableDendro: false,
    enableIframe: false,
    enableAnnotation: false,
    forceTiling: false,
    interactiveTranscript: false,
  },
  "related asset": {
    nestData: true,
    showLabel: true,
    collapseNestedChildren: false,
    thumbnailView: false,
    defaultTemplate: 0,
    matchAgainst: [0],
    displayInline: false,
    ignoreForDigitalAsset: false,
    ignoreForLocationSearch: false,
    ignoreForDateSearch: false,
  },
};

/** Maps field type names (from the getFieldTypes API) to their display icons. */
export const FIELD_TYPE_NAME_ICONS: Record<string, Component> = {
  text: TypeIcon,
  "text area": AlignLeftIcon,
  select: ListIcon,
  checkbox: CheckSquareIcon,
  date: CalendarIcon,
  "tag list": TagIcon,
  multiselect: ListChecksIcon,
  location: MapPinIcon,
  upload: PaperclipIcon,
  "related asset": LinkIcon,
};
