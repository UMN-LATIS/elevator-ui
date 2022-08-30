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

export interface MultiSelectWidget extends Widget {
  fieldData: Record<string, unknown>;
}

export interface RelatedAssetWidget extends Widget {
  fieldData: {
    nestData?: boolean;
    showLabel?: boolean;
    matchAgainst?: number[];
    displayInline?: boolean;
    thumbnailView?: boolean;
    defaultTemplate?: number;
    ignoreForDateSearch?: boolean;
    ignoreForDigitalAsset?: boolean;
    collapseNestedChildren?: boolean;
    ignoreForLocationSearch?: boolean;
  };
}
export interface SelectWidget extends Widget {
  fieldData: {
    multiSelect?: boolean;
    selectGroup?: string[];
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

/**
 * Widget contents are the contents of a specific
 * widget type for a given asset.
 *
 * This data will be part of the asset's json,
 * not the template's json.
 *
 * @example
 * Within the asset, there will be data like:
  ```json
  // asset.json
  {
    "templateId": 68
    "title_1": [
        {
          "fieldContents": "Test Asset",
          "isPrimary": true
        },
        {
          "fieldContents": "Alt Title",
          "isPrimary": false
        }
      ],
    }
    ...
  ```
 *
 * The associated template (68) will tell us what
 * widget is used for rendering the asset.
 * In this case, the widget with
 * `fieldTitle === title_1` is a `text` widget.
 *
 * And within the asset file, the value associated
 * with `title_1` array of objects of type
 * `TextWidgetContents`.
 */
export interface WidgetContents {
  isPrimary: boolean;
  [key: string]: unknown;
}
export interface TextWidgetContents extends WidgetContents {
  fieldContents: string;
}

export interface CheckboxWidgetContents extends WidgetContents {
  fieldContents: boolean;
}

export interface DateWidgetContents extends WidgetContents {
  label: string;
  start: {
    text: string;
    numeric: string; // number cast as a string
  };
  end: {
    text: string;
    numeric: string;
  };
}

export type Coordinates = [number, number];

export interface LocationWidgetContents extends WidgetContents {
  locationLabel: string;
  address: string;
  loc: {
    type: string;
    coordinates: Coordinates;
  };
}

export interface RelatedWidgetContents extends WidgetContents {
  targetAssetId: string;
  label: string;
}

export interface SelectWidgetContents extends WidgetContents {
  fieldContents: string;
}

export interface TagListWidgetContents extends WidgetContents {
  tags: string[];
}

export interface TextAreaWidgetContents extends WidgetContents {
  fieldContents: string; // HTML?
}

export interface UploadWidgetContents extends WidgetContents {
  fileId: string; // hash
  fileDescription: string;
  fileType: string;
  searchData: string | null;
  loc: unknown | null;
  sidecars: unknown; // object
}

export interface MultiSelectWidgetContents extends WidgetContents {
  fieldContents: object;
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
