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
