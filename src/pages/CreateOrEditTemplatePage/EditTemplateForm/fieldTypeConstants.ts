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
    _comment: "selectGroup can be object or array. In object form, the key is what the curator sees, and the value is what the site visitor sees.",
    selectGroup: ["option 1", "option 2", "option 3"],
    selectGroup1: {
      "option 1 - curator view": "option 1 - visitor view",
      "option 2 - curator view": "option 2 - visitor view",
      "option 3 - curator view": "option 3 - visitor view",
    },
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

/** Display name overrides for field types whose API names are confusing or misleading. */
export const FIELD_TYPE_DISPLAY_NAMES: Record<string, string> = {
  // Backend calls this "multiselect" but it's actually a cascading/hierarchical select.
  multiselect: "Cascade Select",
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
