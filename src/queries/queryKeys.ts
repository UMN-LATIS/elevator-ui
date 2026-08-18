export const INSTANCENAV_QUERY_KEY = "instanceNav";
export const INSTANCE_SETTINGS_QUERY_KEY = "instanceSettings";
export const ASSETS_QUERY_KEY = "assets";
export const TEMPLATES_QUERY_KEY = "templates";
export const COLLECTIONS_QUERY_KEY = "collections";
export const SEARCH_QUERY_ID = "search";
export const RELATED_ASSETS_SEARCH_QUERY_ID = "relatedAssets";
export const FILE_METADATA_QUERY_KEY = "fileMetadata";
export const CUSTOM_PAGES = "customPages";
export const DRAWERS_QUERY_KEY = "drawers";
export const FIELD_TYPES_QUERY_KEY = "fieldTypes";
export const FILE_DOWNLOADS_QUERY_KEY = "fileDownloads";
export const ORIGINAL_STORAGE_STATUS_QUERY_KEY = "originalStorageStatus";
export const USER_AUTOCOMPLETE_QUERY_KEY = "userAutocomplete";
export const DRAWER_USER_AUTOCOMPLETE_QUERY_KEY = "drawerUserAutocomplete";

// specific cache subsets
// usage examples:
// - index page: [CUSTOM_PAGES, LIST]
// - individual page: [CUSTOM_PAGES, pageId]
// - edit page (has different data than view page): [CUSTOM_PAGES, pageId, EDIT]
// - public view page (has different data than edit page): [CUSTOM_PAGES, pageId, VIEW]
// if filters are involved, they can be added to the end of the query key array, e.g. [CUSTOM_PAGES, LIST, { filter: "someFilter" }]
export const LIST = "list";
export const EDIT = "edit";
export const VIEW = "view";
