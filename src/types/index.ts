
export enum WidgetType {
    "checkbox",
    "date",
    "location",
    "multiselect",
    "related asset",
    "select",
    "tag list",
    "text",
    "upload"
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
