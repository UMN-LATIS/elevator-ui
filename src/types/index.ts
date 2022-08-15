
export enum WidgetType {
    "checkbox" = "checkbox",
    "date" = "date",
    "location" = "location",
    "multiselect" = "multiselect",
    "related asset" = "related asset",
    "select" = "select",
    "tag list" = "tag list",
    "text" = "text",
    "upload" = "upload"
}

export interface Widget {
    widgetId: number;
    type: WidgetType;
    allowMultiple: boolean;
    attemptAutocomplete: boolean;
    fieldTitle: string;
    label: string;
    tooltip: string;
    fieldData: any;
    display: boolean;
    displayInPreview: boolean;
    required: boolean;
    searchable: boolean;
    directSearch: boolean;
    clickToSearch: boolean;
    clickToSearchType: number;
}

export interface WidgetContents {
    "isPrimary": boolean;
    "fieldContents": any;
}


export interface RelatedWidgetContents {
    "isPrimary": boolean;
    "targetAssetId": string;
    "label": string;
}

                                  
    
export interface DateComponent {
    "text": string;
    "numeric": BigInt;
}
    
export interface LocationComponent {
    "type": string;
    coordinates: number[];
}
export interface DateResult {
    "start": DateComponent;
    "end": DateComponent;
    "loc": LocationComponent;
    "label": string;
    "fileId": string;
    "fileType": string;
    "sidecars": any;
    "isPrimary": boolean;
    "searchData": string;
    "fileDescription": string;
}

export interface CollectionEntry {
    "id": number;
    "title": string;
}

export interface TemplateEntry {
    "id": number;
    "name": string;
}
export interface SearchResultEntry {
    "title": string | string[];
    "dates": DateResult[];
    "locations": LocationComponent[];
    "objectId": string;
    "lastModified": string;
    "collectionHierarchy": CollectionEntry[];
    "template": TemplateEntry;
    "entries": any[];
}

export interface SearchResult {
    "totalResults": number;
    "matches": SearchResultEntry[];
    "searchResults": string[];
    "searchId": string;
}