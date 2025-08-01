import type { Ref } from "vue";
import {
  SEARCH_RESULTS_VIEWS,
  SORT_KEYS,
  TEMPLATE_SHOW_PROPERTY_POSITIONS,
  SAVE_RELATED_ASSET_TYPE,
} from "@/constants/constants";
import { AxiosRequestConfig } from "axios";
import { CascaderSelectOptions } from "@/components/CascadeSelect/CascadeSelect.vue";

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
    moreLikeThis: {
      /**
       * Number of results to show in More Like This
       * section before showing the "Show More" button.
       * If set to 0, users won't see any preview results
       * and will have to click a "More Like This" button.
       */
      maxInlineResults: number;
    };
    textAreaItem: {
      /**
       * height of the the collapsed text area
       * in pixels
       */
      defaultTextTruncationHeight: number;
    };
    googleAnalyticsId: string | null;
  };
  arcgis: {
    apiKey: string;
  };
  routes: {
    home: {
      redirect?: string;
    };
  };
  mode: "development" | "production" | string | null;
  isUsingMockServer?: boolean;
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
    gtag: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export type CSSClass = string | Record<string, boolean> | CSSClass[];

export type FetchStatus = "idle" | "fetching" | "success" | "error";

export const WIDGET_TYPES = {
  TEXT: "text",
  TEXT_AREA: "text area",
  SELECT: "select",
  CHECKBOX: "checkbox",
  DATE: "date",
  TAG_LIST: "tag list",
  MULTISELECT: "multiselect",
  LOCATION: "location",
  UPLOAD: "upload",
  RELATED_ASSET: "related asset",
} as const;

// union of all values of the WIDGET_TYPES object
// e.g. "text" | "text area" | "select" | ...
export type WidgetType = (typeof WIDGET_TYPES)[keyof typeof WIDGET_TYPES];

export interface WidgetDef {
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

export interface TextWidgetDef extends WidgetDef {
  type: "text";
  fieldData: [] | null;
}
export interface CheckboxWidgetDef extends WidgetDef {
  type: "checkbox";
  fieldData: [] | null;
}
export interface DateWidgetDef extends WidgetDef {
  type: "date";
  fieldData: [] | null;
}
export interface LocationWidgetDef extends WidgetDef {
  type: "location";
  fieldData: [] | null;
}
export interface TagListWidgetDef extends WidgetDef {
  type: "tag list";
  fieldData: [] | null;
}
export interface TextAreaWidgetDef extends WidgetDef {
  type: "text area";
  fieldData: [] | null;
}

export interface MultiSelectFieldData {
  [key: string]:
    | string[]
    | {
        [key: string]: MultiSelectFieldData;
      };
}

export interface MultiSelectWidgetDef extends WidgetDef {
  type: "multiselect";
  fieldData: MultiSelectFieldData;
}

export interface RelatedAssetWidgetDef extends WidgetDef {
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

export interface SelectWidgetDef extends WidgetDef {
  type: "select";
  fieldData: {
    multiSelect?: boolean;
    selectGroup?: string[] | Record<string | number, string | undefined>;
  };
}
export interface UploadWidgetDef extends WidgetDef {
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
  numeric: string | null; // unix timestamp, actually a string
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
  loc?: LocationObject;
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
  sidecars: {
    ppm?: number | null; // pixels per millimeter
    iframe?: string | null; // iframe url
    svs?: Record<string, unknown> | string | null; // SVS data
    svx?: Record<string, unknown> | string | null; // SVX data for OBJ
    dendro?: Record<string, unknown> | string | null; // dendro data (JSON string)
    captions?: string | null; // captions data
    chapters?: string | null; // chapters data
    "3dpoints"?: string | null; // 3D data
  };
  regenerate?: "On" | undefined; // regenerate derivatives
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
  excerpt?: true;
  excerptAsset?: string;
  excerptId?: number;
  excerptLabel?: string;
}

export type AssetPreview = SearchResultMatch;

export interface SearchEntry {
  collection?: string[]; // collection ids as strings
  searchDate?: PHPDateTime;
  searchText?: string;
  matchType?: string; // 'phrase_prefix' ?
  showHidden?: boolean | "0" | "1";
  useBoolean?: boolean | "0" | "1";
  fuzzySearch?: "0" | "1";
  sort?: string;
  specificFieldSearch?: SpecificFieldSearchItem[];
  combineSpecificSearches: "OR" | "AND";
  startDateText?: string;
  startDate?: string; // unix timestamp
  endDateText?: string;
  endDate?: string; // unix timestamp
  longitude?: string;
  latitude?: string;
  distance?: string; // radius to search in miles
  fileTypesSearch?: GlobalSearchableFileType;
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
  showHidden?: "on" | undefined;
  useBoolean?: "on" | undefined;
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

export interface PHPDateTime {
  date: string; // `2025-04-22 00:00:00.000000`
  timezone: string; // 'UTC'
  timezone_type: number; // 3 usually
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
  assetId: string;
  templateId: number;
  readyForDisplay: boolean;
  collectionId: number;
  availableAfter: PHPDateTime | null;
  modified: PHPDateTime;
  modifiedBy: number | string;
  createdBy: number | string;
  deletedBy: number | string | null;
  relatedAssetCache: RelatedAssetCache | null | never[];
  firstFileHandlerId?: string | null;
  firstObjectId?: string | null;
  titleObject?: string | null;
  title?: string[];
  [key: string]: unknown; // widget content
}

export type UnsavedAsset = Omit<Asset, "assetId"> & { assetId: null };

type TemplateShowPropertyPosition =
  (typeof TEMPLATE_SHOW_PROPERTY_POSITIONS)[keyof typeof TEMPLATE_SHOW_PROPERTY_POSITIONS];

export interface Template {
  templateId: number;
  templateName: string;
  showCollection: boolean;
  showCollectionPosition: TemplateShowPropertyPosition;
  showTemplate: boolean;
  showTemplatePosition: TemplateShowPropertyPosition;
  widgetArray: WidgetDef[];
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
export type ElevatorLTIVersion = "1.1" | "1.3";
export type ElevatorLTIId = string;
export type ElevatorUserID = string;

export interface ElevatorPluginInitMessageData {
  pluginSetup: boolean;
  elevatorPlugin: ElevatorPluginType;
  elevatorCallbackType: ElevatorCallbackType;
  apiKey: string;
  timeStamp: string;
  entangledSecret: string;
  includeMetadata: boolean;
  ltiVersion?: ElevatorLTIVersion;
  launchId?: ElevatorLTIId;
  userId?: ElevatorUserID;
  returnUrl?: string;
}

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
  instanceShowCollectionInSearchResults: boolean;
  instanceShowTemplateInSearchResults: boolean;
  contact: string;
  useCentralAuth: boolean;
  centralAuthLabel: string;
  collections: RawAssetCollection[];
  sortableFields: Record<string, RawSortableField>;
  templates: Record<number, string>; // { templateId: templateName }
  featuredAssetId: string; // featured asset for homepage
  featuredAssetText: string; // text appearing above the featured asset
  customHeaderMode: ShowCustomHeaderMode;
  customHeader?: string | null; // html
  customFooter?: string | null; // html
  useVoyagerViewer: boolean; // whether or not to use the Voyager viewer
  useCustomCSS: boolean; // whether or not to use custom CSS
}

export interface StaticContentPage {
  id?: number;
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
  templates: { id: number; name: string }[];
  showCollectionInSearchResults: boolean; // whether or not to show collection in search results
  showTemplateInSearchResults: boolean; // whether or not to show template in search results
  useVoyagerViewer: boolean; // whether or not to use the Voyager viewer
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
  isDownloadable: boolean;
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
  addMarker: (args: AddMarkerArgs) => GeoJSON.Feature;
  removeMarker: (markerId: string) => void;
  setMarkerPopupContainer: (
    markerId: string,
    popupContainerRef: Ref<HTMLElement | null>
  ) => void;
  removeMarkerPopup: (markerId: string) => void;
  renderMarkers: () => void;
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
  rawContent: CascaderSelectOptions; // recursive tree of options
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

export type GlobalSearchableFileType =
  | ""
  | "image"
  | "movie"
  | "audio"
  | "office"
  | "txt"
  | "pdf"
  | "ply"
  | "zipobj"
  | "zipmeddicom"
  | "zipscorm";

export interface Drawer {
  id: number;
  title: string;
  contents?: {
    matches: SearchResultMatch[];
    sortBy: DrawerSortOptions | null;
    totalResults: number;
  };
}

export type ApiListDrawersResponse = Record<number, { title: string }>;

export interface ApiCreateDrawerResponse {
  drawerId: number;
  drawerTitle: string;
}

export type DrawerSortOptions = "title.raw" | "custom";

export interface ApiGetDrawerResponse {
  searchResults: string[];
  matches: SearchResultMatch[];
  totalResults: number;
  drawerId: number;
  drawerTitle: string;
  sortBy: DrawerSortOptions | null; // this is persisted in the database
}

export interface ApiErrorResponse {
  error: string;
}

export interface ApiSuccessResponse {
  success: boolean;
}

export type ApiAddAssetToDrawerResponse = ApiSuccessResponse;

export type ApiRemoveAssetFromDrawerResponse = ApiSuccessResponse;

export interface Toast {
  id: string;
  message: string;
  duration?: number;
  url?: string;
  urlText?: string;
}

export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  skipErrorNotifications?: boolean;
}

export type ApiStartDrawerDownloadResponse =
  | {
      status: "accepted";
      jobId: number;
    }
  | {
      status: "completed";
      url: string;
    };

export interface AssetExcerpt {
  fileHandlerId: string;
  name: string;
  startTime: number;
  endTime: number;
}

export interface ApiGetExcerptResponse {
  id: number;
  label: string;
  startTime: number;
  endTime: number;
  fileObjectId: string;
  isEmbedded: boolean;
  embedUrl: string;
  assetId: string;
}

export type WithId<T> = T & { id: string };

export interface UpdateAssetRequestFormData {
  objectId: string;
  templateId: string; // "3"
  newTemplateId: string; // matches templateId
  collectionId: string; // "1"
  newCollectionId: string; // matches collectionId
  readyForDisplay: boolean; // legacy app submits `on` for true, and unset for false
  availableAfter: string | ""; // no scheduled date === ''
  [widgetFieldName: string]:
    | string
    | boolean
    | Array<{
        fieldContents: string;
        isPrimary?: "0" | "1";
      }>;
}

export interface CreateAssetRequestFormData extends UpdateAssetRequestFormData {
  objectId: ""; // must be blank for creating a new asset
}
export interface AssetSummary {
  objectId: Asset["objectId"];
  title: string;
  readyForDisplay: boolean;
  templateId: number;
  modifiedDate: {
    date: string;
    timezone_type: number;
    timezone: string;
  };
}

export interface SelectOption {
  id: string;
  label: string;
}

export interface GeocoderResult {
  lat: number;
  lng: number;
  address: string;
}

export interface TemplateComparison {
  [widgetFieldTitle: WidgetDef["fieldTitle"]]: {
    type: string; // error like "missing"
    label: WidgetDef["label"];
  };
}

export interface BroadcastMessage {
  type: string;
  payload: unknown;
}
export interface RelatedAssetSaveMessage extends BroadcastMessage {
  type: typeof SAVE_RELATED_ASSET_TYPE;
  payload: {
    relatedAssetId: string;
  };
}
export interface FileContainer {
  bucket: string; // "elevatorbucket"
  bucketKey: string; // "AKIA..."
  fileObjectId: string; // "686eea..."
  collectionId: string; // "1"
  index: number; // 0
  path: string; // "original"
}

export type GetFileContainerApiResponse = FileContainer[];

export interface FileUploadRecord {
  filename: string;
  fileObjectId: string;
  contentType: string;
  uploadId: string;
  key: string; // s3 "key" aka path to the file in S3
  uploadStatus: "in-progress" | "completed" | "failed";
  location?: string; // S3 URL of the uploaded file
}

export interface CollectionDescription {
  collectionDescription: string;
  collectionTitle: string;
}

export enum ShowCustomHeaderMode {
  NEVER = 0,
  ALWAYS = 1,
  HOME_PAGE_ONLY = 2,
}

export interface ApiAssetSubmissionResponse {
  objectId: string;
  success?: boolean;
}
