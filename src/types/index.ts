export enum WidgetType {
  "checkbox" = "checkbox",
  "date" = "date",
  "location" = "location",
  "multiselect" = "multiselect",
  "related asset" = "related asset",
  "select" = "select",
  "tag list" = "tag list",
  "text" = "text",
  "upload" = "upload",
}

export interface Widget {
  widgetId: number;
  type: WidgetType;
  allowMultiple: boolean;
  attemptAutocomplete: boolean;
  fieldTitle: string;
  label: string;
  tooltip: string;
  fieldData: unknown;
  display: boolean;
  displayInPreview: boolean;
  required: boolean;
  searchable: boolean;
  directSearch: boolean;
  clickToSearch: boolean;
  clickToSearchType: number;
  viewOrder: number;
  templateOrder: number;
}

interface WidgetWithoutFieldData extends Widget {
  fieldData: [];
}

export type TextWidget = WidgetWithoutFieldData;
export type CheckboxWidget = WidgetWithoutFieldData;
export type DateWidget = WidgetWithoutFieldData;
export type LocationWidget = WidgetWithoutFieldData;
export type TagListWidget = WidgetWithoutFieldData;
export type TextAreaWidget = WidgetWithoutFieldData;

export interface MultiselectWidget extends Widget {
  fieldData: Record<string, unknown>;
}

export interface RelatedAssetWidget extends Widget {
  fieldData: {
    nestData: boolean;
    showLabel: boolean;
    matchAgainst: number[];
    displayInline: boolean;
    thumbnailView: boolean;
    defaultTemplate: number;
    ignoreForDateSearch: boolean;
    ignoreForDigitalAsset: boolean;
    collapseNestedChildren: boolean;
    ignoreForLocationSearch: boolean;
  };
}
export interface SelectWidget extends Widget {
  fieldData: {
    multiSelect: boolean;
    selectGroup: string[];
  };
}

export interface UploadWidget extends Widget {
  fieldData: {
    extractDate?: boolean;
    forceTiling?: boolean;
    enableDendro?: boolean;
    enableIframe?: boolean;
    enableTiling?: boolean;
    extractLocation?: boolean;
    enableAnnotation?: boolean;
    interactiveTranscript?: boolean;
    ignoreForDigitalAsset?: boolean;
  };
}

export interface WidgetContents {
  isPrimary: boolean;
  fieldContents: unknown;
}

export interface RelatedWidgetContents {
  isPrimary: boolean;
  targetAssetId: string;
  label: string;
}

export interface DateComponent {
  text: string;
  numeric: bigint;
}

export interface LocationComponent {
  type: string;
  coordinates: number[];
}
export interface DateResult {
  start: DateComponent;
  end: DateComponent;
  loc: LocationComponent;
  label: string;
  fileId: string;
  fileType: string;
  sidecars: unknown;
  isPrimary: boolean;
  searchData: string;
  fileDescription: string;
}

export interface CollectionEntry {
  id: number;
  title: string;
}

export interface TemplateEntry {
  id: number;
  name: string;
}
export interface SearchResultEntry {
  title: string | string[];
  dates: DateResult[];
  locations: LocationComponent[];
  objectId: string;
  lastModified: string;
  collectionHierarchy: CollectionEntry[];
  template: TemplateEntry;
  entries: unknown[];
}

export interface SearchResult {
  totalResults: number;
  matches: SearchResultEntry[];
  searchResults: string[];
  searchId: string;
}

export interface DateTime {
  date: string;
  timezone_type: number;
  timezone: string;
}

export interface RelatedAsset {
  primaryHandler: unknown | null;
  readyForDisplay: boolean;
  relatedAssetTitle: string[];
}
export interface Asset {
  templateId: number;
  readyForDisplay: boolean;
  collectionId: number;
  availableAfter: unknown | null;
  modified: DateTime;
  modifiedBy: number;
  createdBy: number;
  deletedBy: number | null;
  relatedAssetCache: Record<string, RelatedAsset>;
  firstFileHandlerId?: string | null;
  firstObjectId?: string | null;
  titleObject: string;
  [key: string]: unknown;
}
export interface Template {
  templateId: string;
  telmateName: string;
  widgetArray: Widget[];
  collections?: Record<string, string | unknown>;
}
