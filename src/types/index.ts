import type { Ref } from "vue";
import { SEARCH_RESULTS_VIEWS, SORT_KEYS } from "@/constants/constants";
export * from "./TimelineJSTypes";

export interface AppConfig {
  instance: {
    base: {
      origin: string;
      path: string;
      url: string;
    };
    theming: {
      availableThemes: string[];
      enabled: boolean;
      defaultTheme: string;
    };
  };
  arcgis: {
    apiKey: string;
  };
  routes: {
    test: string | null;
  };
  mode: "development" | "production" | string | null;
  moreLikeThis: {
    /**
     * Number of results to show in More Like This
     * section before showing the "Show More" button.
     * If set to 0, users won't see any preview results
     * and will have to click a "More Like This" button.
     */
    maxInlineResults: number;
  };
}

/**
 * settings for the app may also appear on
 * window.Elevator.config
 */
declare global {
  interface Window {
    Elevator?: {
      config?: Partial<AppConfig>;
    };
    location: Location;
  }
}

export type FetchStatus = "idle" | "fetching" | "success" | "error";

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

export interface WidgetProps {
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

export interface TextWidgetProps extends WidgetProps {
  type: "text";
  fieldData: [] | null;
}
export interface CheckboxWidgetProps extends WidgetProps {
  type: "checkbox";
  fieldData: [] | null;
}
export interface DateWidgetProps extends WidgetProps {
  type: "date";
  fieldData: [] | null;
}
export interface LocationWidgetProps extends WidgetProps {
  type: "location";
  fieldData: [] | null;
}
export interface TagListWidgetProps extends WidgetProps {
  type: "tag list";
  fieldData: [] | null;
}
export interface TextAreaWidgetProps extends WidgetProps {
  type: "text area";
  fieldData: [] | null;
}

export interface MultiSelectWidgetProps extends WidgetProps {
  type: "multiselect";
  fieldData: Record<string, unknown>;
}

export interface RelatedAssetWidgetProps extends WidgetProps {
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

export interface SelectWidgetProps extends WidgetProps {
  type: "select";
  fieldData: {
    multiSelect?: boolean;
    selectGroup?: string[] | Record<string | number, string | undefined>;
  };
}
export interface UploadWidgetProps extends WidgetProps {
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
export interface WidgetContent {
  isPrimary?: boolean;
  [key: string]: unknown;
}
export interface TextWidgetContent extends WidgetContent {
  fieldContents: string;
}

export interface CheckboxWidgetContent extends WidgetContent {
  fieldContents: boolean;
}

export interface DateMoment {
  text: string | null;
  numeric: number | null;
}
export interface DateWidgetContent extends WidgetContent {
  label: string;
  start: DateMoment;
  end: DateMoment;
  range?: boolean;
}

export type Coordinates = [
  number, //lng
  number //lat
];

export interface LocationEntry {
  loc: {
    type: string;
    coordinates: Coordinates;
  };
  [key: string]: unknown;
}

export interface LocationObject {
  label?: string;
  entries?: LocationEntry[];
  type?: string;
  coordinates?: Coordinates;
}

export interface LocationWidgetContent extends WidgetContent {
  locationLabel: string | null;
  address: string | null;
  loc: LocationObject | null;
}

export interface RelatedAssetWidgetContent extends WidgetContent {
  targetAssetId: string | null;
  label: string | null;
}

export interface SelectWidgetContent extends WidgetContent {
  fieldContents: string | null;
}

export interface TagListWidgetContent extends WidgetContent {
  tags: string[] | null;
}

export interface TextAreaWidgetContent extends WidgetContent {
  fieldContents: string | null;
}

export interface UploadWidgetContent extends WidgetContent {
  fileId: string; // hash
  fileDescription: string;
  fileType: string;
  searchData: string | null;
  loc: unknown | null;
  sidecars: unknown; // object
}

export interface MultiSelectWidgetContent extends WidgetContent {
  fieldContents: object;
}

export interface DateComponent {
  text: string;
  numeric: bigint;
}

export interface DateAssetObject {
  start: {
    text: string;
    numeric: string | number;
  };
  end?: {
    text: string;
    numeric: string | number;
  };
  label?: string | null;
  isPrimary?: boolean;
  [key: string]: unknown;
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
  dateAsset: DateAssetObject[];
  [key: string]: unknown;
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
  lastModified?: string;
  collectionHierarchy: Array<{
    id: number;
    title: string;
  }>;
  template: TemplateEntry;
  entries?: SearchResultMatchEntry[];
  fileAssets?: number;
  primaryHandlerId?: string | null; // hash
  primaryHandlerType?: string;
  primaryHandlerTiny?: string; // URI
  primaryHandlerTiny2x?: string; // URI
  primaryHandlerThumbnail?: string; //URI
  primaryHandlerThumbnail2x?: string; //URI
  base_url?: string; // '/defaultinstance/'
  isChild?: boolean;
  hasChildren?: boolean;
}

export interface SearchEntry {
  collection?: string[]; // collection ids as strings
  searchDate?: DateTime;
  searchText?: string;
  matchType?: string; // 'phrase_prefix' ?
  showHidden?: "0" | "1";
  fuzzySearch?: "0" | "1";
  sort?: string;
  specificFieldSearch?: SpecificFieldSearchItem[];
  combineSpecificSearches: "OR" | "AND";
  startDateText?: string;
  startDate?: string; // unix timestamp
  endDateText?: string;
  endDate?: string; // unix timestamp
}

export interface SearchSortOptions {
  // well defined sort options for all searches
  [SORT_KEYS.BEST_MATCH]: "Best Match";
  [SORT_KEYS.TITLE]: "Default Title";
  [SORT_KEYS.LAST_MODIFIED_DESC]: "Modified Date (newest to oldest)";
  [SORT_KEYS.LAST_MODIFIED_ASC]: "Modified Date (oldest to newest)";

  // sort options for specific searches
  [key: string]: string;
}

export interface SpecificFieldSearchItem {
  field: string;
  text: string;
  fuzzy: boolean;
}

export interface SearchRequestOptions {
  searchText?: string;
  sort?: keyof SearchSortOptions;
  collection?: string[] | number[] | null;
  specificFieldSearch?: SpecificFieldSearchItem[];
  combineSpecificSearches?: "OR" | "AND";
  fileTypesSearch?: string;
  distance?: string;
  latitude?: string;
  longitude?: string;
  startDateText?: string;
  startDate?: string;
  endDateText?: string;
  endDate?: string;
}

export interface SearchResultsResponse {
  totalResults: number;
  matches: SearchResultMatch[];
  searchResults: string[];
  searchId: string;
  success?: boolean;
  searchEntry: SearchEntry;
  sortableWidgets: SearchSortOptions;
}

export interface DateTime {
  date: string;
  timezone_type: number;
  timezone: string;
}

export interface RelatedAssetCacheItem {
  primaryHandler: string | null;
  readyForDisplay: boolean;
  relatedAssetTitle: string[];
}

export interface ChildOrRelatedAsset {
  id: string;
  title: string;
  objectId?: string;
  thumb: {
    src: string;
    alt: string;
  };
}

export interface RelatedAssetCacheItemWithId extends RelatedAssetCacheItem {
  id: string;
}

export type RelatedAssetCache = Record<
  string,
  RelatedAssetCacheItem | null | undefined
>;

export interface Asset {
  templateId: number;
  readyForDisplay: boolean;
  collectionId: number;
  availableAfter: unknown | null;
  modified: DateTime;
  modifiedBy: number | string;
  createdBy: number | string;
  deletedBy: number | string | null;
  relatedAssetCache: RelatedAssetCache | null;
  firstFileHandlerId?: string | null;
  firstObjectId?: string | null;
  titleObject?: string | null;
  title?: string[];
  [key: string]: unknown;
}
export interface Template {
  templateId: string;
  templateName: string;
  widgetArray: WidgetProps[];
  collections?: Record<string | number, string | undefined | unknown>;
  allowedCollections?:
    | Record<string | number, string | undefined | unknown>
    | unknown[];
}

export interface LngLat {
  lng: number;
  lat: number;
}

export type BoundingBox = [[number, number], [number, number]];

export interface Image {
  src: string;
  alt: string;
}

export interface ApiInterstitialResponse {
  haveInterstitial: boolean;
  interstitialText?: string;
}

export type ElevatorPluginType = "Canvas" | "Wordpress" | string;

export type ElevatorCallbackType = "lti" | "JS";

export interface RawSortableField {
  label: string;
  template: number;
  type: WidgetType;
}

export interface ApiInstanceNavResponse {
  pages: Page[];
  userId: number | null;
  userDisplayName: string | null;
  userIsloggedIn: boolean;
  userIsAdmin: boolean;
  userIsSuperAdmin: boolean;
  userCanManageAssets: boolean;
  userCanCreateDrawers: boolean;
  userCanSearchAndBrowse: boolean;
  instanceName: string;
  instanceId: number;
  instanceHasLogo: boolean;
  instanceLogo: number;
  contact: string;
  useCentralAuth: boolean;
  centralAuthLabel: string;
  collections: RawAssetCollection[];
  sortableFields: Record<string, RawSortableField>;
  featuredAssetId: string; // featured asset for homepage
  featuredAssetText: string; // text appearing above the featured asset
}

export interface StaticContentPage {
  title: string;
  content: string | null; // raw HTML
}

export type ApiStaticPageResponse = StaticContentPage;

export interface InstanceStoreState {
  fetchStatus: FetchStatus;
  pages: Page[];
  currentUser: User | null;
  instance: ElevatorInstance;
  collections: AssetCollection[];
  searchableFields: SearchableSpecificField[];
}

export interface ElevatorInstance {
  id: number | null;
  name: string | null;
  logoImg: Image | null; // path to logo if one exists
  contact: string | null; // email contact
  useCentralAuth: boolean; // whether or not to use central auth
  centralAuthLabel: string; // label for central auth
  featuredAssetId: string | null; // featured asset for homepage
  featuredAssetText: string | null; // text appearing above the featured asset
  // whether or not to show search and browse
  // may be true even if user is not logged in
  userCanSearchAndBrowse: boolean;
}

export interface RawAssetCollection {
  id: number;
  title: string;
  previewImageId?: string | null;
  children?: RawAssetCollection[];
}

export interface AssetCollection {
  id: number;
  title: string;
  description?: string | null;
  previewImageId: string | null;
  children: AssetCollection[] | null;
  parentId: number | null;
}

export interface Page {
  title: string;
  id: number;
  children?: Page[];
}

export interface User {
  id: number;
  displayName: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canManageAssets: boolean;
  canManageDrawers: boolean;
}

export interface NavItem {
  id: number | string;
  name: string;
  href: string | null;
  isCurrentPage?: boolean;
  children?: NavItem[];
}

export interface FileDownloadNormalized {
  filetype: string;
  isReady: boolean;
  url: string;
  originalFilename: string;
  extension: string;
}

export interface Tab {
  id: string;
  label: string;
}

export interface TabsContext {
  addTab: (tab: Tab) => void;
  removeTab: (tab: Tab) => void;
  setActiveTab: (id: string) => void;
  isActiveTab: (id: string) => boolean;
  initialTabId?: string;
}

// must be a member of the SEARCH_RESULTS_VIEWS array
export type SearchResultsView = (typeof SEARCH_RESULTS_VIEWS)[number];
export interface MarkerContext {
  createPopup: (containerRef: Ref<HTMLElement | null>) => void;
  removePopup: () => void;
}

export interface AddMarkerArgs {
  id: string;
  lng: number;
  lat: number;
  [key: string]: unknown; // other properties
}

export interface MapContext {
  createOrUpdateMarker: (args: AddMarkerArgs) => GeoJSON.Feature;
  removeMarker: (markerId: string) => void;
  setMarkerPopupContainer: (
    markerId: string,
    popupContainerRef: Ref<HTMLElement | null>
  ) => void;
  removeMarkerPopup: (markerId: string) => void;
}

export interface LocalLoginResponse {
  status: "success" | "error";
  message: string;
}

export interface ApiGetFieldInfoResponse {
  type: WidgetType;
  values?: unknown;
}

export interface ApiGetSelectFieldInfoResponse extends ApiGetFieldInfoResponse {
  type: "select";
  values: string[]; // options for select
}

export interface ApiGetCheckboxFieldInfoResponse
  extends ApiGetFieldInfoResponse {
  type: "checkbox";
  values: {
    boolean_true: string; // label for true
    boolean_false: string; // label for false
  };
}

export interface TreeNode {
  [key: string]: TreeNode | string[];
}

export interface ApiGetMultiSelectFieldInfoResponse
  extends ApiGetFieldInfoResponse {
  type: "multiselect";
  rawContent: TreeNode; // recursive tree of options
}

export interface SearchableSpecificField extends RawSortableField {
  id: string;
}

export interface SearchableSelectField extends SearchableSpecificField {
  type: "select";
}

export interface SearchableCheckboxField extends SearchableSpecificField {
  type: "checkbox";
}

export interface SearchableMultiSelectField extends SearchableSpecificField {
  type: "multiselect";
}

export interface SearchableSpecificFieldFilter {
  id: string; // filter uuid not field id
  fieldId: string;
  value: string;
  isFuzzy: boolean;
  createdAt: string;
}

export type GlobalSearchableFieldFilter = SearchableSpecificFieldFilter;

export interface SearchableCheckboxFieldFilter
  extends SearchableSpecificFieldFilter {
  value: "boolean_true" | "boolean_false";
}
