
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
