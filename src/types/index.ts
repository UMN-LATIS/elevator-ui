export type WidgetType =
  | "checkbox"
  | "date"
  | "location"
  | "multiselect"
  | "related asset"
  | "select"
  | "tag list"
  | "text"
  | "upload"
  | "text area";

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

export interface TextWidget extends Widget {
  type: "text";
  fieldData: [] | null;
}
export interface CheckboxWidget extends Widget {
  type: "checkbox";
  fieldData: [] | null;
}
export interface DateWidget extends Widget {
  type: "date";
  fieldData: [] | null;
}
export interface LocationWidget extends Widget {
  type: "location";
  fieldData: [] | null;
}
export interface TagListWidget extends Widget {
  type: "tag list";
  fieldData: [] | null;
}
export interface TextAreaWidget extends Widget {
  type: "text area";
  fieldData: [] | null;
}

export interface MultiSelectWidget extends Widget {
  type: "multiselect";
  fieldData: Record<string, unknown>;
}

export interface RelatedAssetWidget extends Widget {
  type: "related asset";
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
  type: "select";
  fieldData: {
    multiSelect?: boolean;
    // TODO: This could be a key/value pair
    selectGroup?: string[] | Record<string | number, string>;
  };
}

export interface UploadWidget extends Widget {
  type: "upload";
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
 * widget for a given asset.
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

export interface DateMoment {
  text: string | null;
  numeric: number | null;
}
export interface DateWidgetContents extends WidgetContents {
  label: string;
  start: DateMoment;
  end: DateMoment;
  range?: boolean;
}

export type Coordinates = [number, number];

export interface LocationObject {
  label?: string;
  entries?: unknown[];
  type?: string;
  coordinates?: Coordinates;
}

export interface LocationWidgetContents extends WidgetContents {
  locationLabel: string | null;
  address: string | null;
  loc: LocationObject | null;
}

export interface RelatedAssetWidgetContents extends WidgetContents {
  targetAssetId: string | null;
  label: string | null;
}

export interface SelectWidgetContents extends WidgetContents {
  fieldContents: string | null;
}

export interface TagListWidgetContents extends WidgetContents {
  tags: string[] | null;
}

export interface TextAreaWidgetContents extends WidgetContents {
  fieldContents: string | null;
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

export interface DateResult {
  start?: DateComponent;
  end?: DateComponent;
  loc?: LocationObject;
  label?: string;
  fileId?: string;
  fileType?: string;
  sidecars?: unknown;
  isPrimary?: boolean;
  searchData?: string;
  fileDescription?: string;
  dateAsset?: object[];
  [key: string]: unknown;
}

export interface CollectionEntry {
  id: number;
  title: string;
}

export interface TemplateEntry {
  id: number;
  name: string;
}

export interface SearchResultMatchEntry {
  entries?: string[];
  Related_asset?: boolean;
  Date?: boolean;
  Select?: boolean;
  Location?: boolean;
  label?: string;
  Text?: boolean;
}

export interface SearchResultMatch {
  title: string | string[] | null;
  dates: DateResult[];
  locations: LocationObject[];
  objectId: string;
  lastModified: string;
  collectionHierarchy: CollectionEntry[];
  template: TemplateEntry;
  entries?: SearchResultMatchEntry[];
  fileAssets?: number;
  primaryHandlerId?: string; // hash
  primaryHandlerType?: string;
  primaryHandlerTiny?: string; // URI
  primaryHandlerTiny2x?: string; // URI
  primaryHandlerThumbnail?: string; //URI
  primaryHandlerThumbnail2x?: string; //URI
}

export interface Search {
  totalResults: number;
  matches: SearchResultMatch[];
  searchResults: string[];
  searchId: string;
  success?: boolean;
  searchEntry: unknown;
}

export interface DateTime {
  date: string;
  timezone_type: number;
  timezone: string;
}

export interface RelatedAsset {
  primaryHandler: string | null;
  readyForDisplay: boolean;
  relatedAssetTitle: string[];
}
export interface Asset {
  templateId: number;
  readyForDisplay: boolean;
  collectionId: number;
  availableAfter: unknown | null;
  modified: DateTime;
  modifiedBy: number | string;
  createdBy: number | string;
  deletedBy: number | string | null;
  relatedAssetCache: Record<string, RelatedAsset> | null;
  firstFileHandlerId?: string | null;
  firstObjectId?: string | null;
  titleObject?: string | null;
  [key: string]: unknown;
}
export interface Template {
  templateId: string;
  templateName: string;
  widgetArray: Widget[];
  collections?: Record<string | number, string | unknown>;
  allowedCollections?: Record<string | number, string | unknown> | unknown[];
}
