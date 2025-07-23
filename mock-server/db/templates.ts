import { Template } from "../../src/types";

const templateSeeds: Template[] = [
  {
    templateId: 1,
    templateName: "Some Fields",
    showCollection: false,
    showTemplate: false,
    showCollectionPosition: 1,
    showTemplatePosition: 1,
    widgetArray: [
      {
        widgetId: 19,
        type: "text",
        allowMultiple: false,
        attemptAutocomplete: false,
        fieldTitle: "title_1",
        label: "Title",
        tooltip: "",
        fieldData: [],
        display: true,
        displayInPreview: true,
        required: true,
        searchable: true,
        directSearch: false,
        clickToSearch: false,
        clickToSearchType: 1,
        viewOrder: 1,
        templateOrder: 1,
      },
      {
        widgetId: 20,
        type: "checkbox",
        allowMultiple: false,
        attemptAutocomplete: false,
        fieldTitle: "checkbox_1",
        label: "Checkbox",
        tooltip: "",
        fieldData: [],
        display: true,
        displayInPreview: false,
        required: false,
        searchable: false,
        directSearch: false,
        clickToSearch: false,
        clickToSearchType: 1,
        viewOrder: 2,
        templateOrder: 2,
      },
      {
        widgetId: 21,
        type: "upload",
        allowMultiple: true,
        attemptAutocomplete: false,
        fieldTitle: "upload_1",
        label: "Upload",
        tooltip: "",
        fieldData: {
          extractDate: true,
          forceTiling: false,
          enableDendro: true,
          enableIframe: true,
          enableTiling: true,
          extractLocation: true,
          enableAnnotation: false,
          interactiveTranscript: false,
        },
        display: true,
        displayInPreview: false,
        required: false,
        searchable: false,
        directSearch: false,
        clickToSearch: false,
        clickToSearchType: 1,
        viewOrder: 3,
        templateOrder: 3,
      },
      {
        widgetId: 22,
        type: "date",
        allowMultiple: false,
        attemptAutocomplete: false,
        fieldTitle: "date_1",
        label: "Date",
        tooltip: "",
        fieldData: [],
        display: true,
        displayInPreview: false,
        required: false,
        searchable: false,
        directSearch: false,
        clickToSearch: false,
        clickToSearchType: 1,
        viewOrder: 4,
        templateOrder: 4,
      },
      {
        widgetId: 23,
        type: "location",
        allowMultiple: true,
        attemptAutocomplete: false,
        fieldTitle: "location_1",
        label: "Location",
        tooltip: "",
        fieldData: [],
        display: true,
        displayInPreview: false,
        required: false,
        searchable: false,
        directSearch: false,
        clickToSearch: false,
        clickToSearchType: 1,
        viewOrder: 5,
        templateOrder: 5,
      },
    ],
    collections: {
      "1": "Default Collection",
    },
    allowedCollections: {
      "1": "Default Collection",
    },
  },
];

const templateStore = new Map<Template["templateId"], Template>(
  templateSeeds.map((template) => [template.templateId, template])
);

export const templates = {
  get: (templateId: Template["templateId"]): Template | undefined => {
    return templateStore.get(templateId);
  },
  getAll: (): Template[] => {
    return Array.from(templateStore.values());
  },
  create: (template: Template): void => {
    templateStore.set(template.templateId, template);
  },
  delete: (templateId: Template["templateId"]): void => {
    templateStore.delete(templateId);
  },
};
