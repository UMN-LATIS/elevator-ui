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
