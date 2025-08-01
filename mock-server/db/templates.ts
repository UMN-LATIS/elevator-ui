import { Template } from "../../src/types";
import { createBaseTable } from "./baseTable";

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
  {
    templateId: 68,
    templateName: "All Fields Test",
    showCollection: false,
    showTemplate: false,
    showCollectionPosition: 1,
    showTemplatePosition: 1,
    widgetArray: [
      {
        widgetId: 45306,
        type: "text",
        allowMultiple: true,
        attemptAutocomplete: true,
        fieldTitle: "title_1",
        label: "Title",
        tooltip: "",
        fieldData: [],
        display: true,
        displayInPreview: true,
        required: true,
        searchable: true,
        directSearch: false,
        clickToSearch: true,
        clickToSearchType: 1,
        viewOrder: 1,
        templateOrder: 1,
      },
      {
        widgetId: 45307,
        type: "checkbox",
        allowMultiple: false,
        attemptAutocomplete: false,
        fieldTitle: "coolstuff_1",
        label: "Cool Stuff",
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
        widgetId: 45308,
        type: "date",
        allowMultiple: true,
        attemptAutocomplete: false,
        fieldTitle: "creation_1",
        label: "Creation",
        tooltip: "",
        fieldData: [],
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
        widgetId: 45309,
        type: "location",
        allowMultiple: false,
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
        viewOrder: 4,
        templateOrder: 4,
      },
      {
        widgetId: 45310,
        type: "multiselect",
        allowMultiple: false,
        attemptAutocomplete: false,
        fieldTitle: "cascadeselect_1",
        label: "Cascade Select",
        tooltip: "",
        fieldData: {
          country: {
            usa: {
              state: {
                minnesota: {
                  city: {
                    mankato: {
                      neighborhood: ["campus", "downtown"],
                    },
                    minneapolis: {
                      neighborhood: ["uptown", "downtown"],
                    },
                  },
                },
                wisconsin: {
                  city: ["madison", "milwaukee"],
                },
              },
            },
            canada: {
              state: {
                quebec: {
                  city: ["montreal"],
                },
                alberta: {
                  city: ["fakeville", "faketown"],
                },
              },
            },
          },
        },
        display: true,
        displayInPreview: false,
        required: false,
        searchable: true,
        directSearch: true,
        clickToSearch: true,
        clickToSearchType: 1,
        viewOrder: 5,
        templateOrder: 5,
      },
      {
        widgetId: 45311,
        type: "related asset",
        allowMultiple: true,
        attemptAutocomplete: true,
        fieldTitle: "relatedstuff_1",
        label: "Related Stuff",
        tooltip: "",
        fieldData: {
          nestData: true,
          showLabel: true,
          matchAgainst: [68, 45],
          displayInline: false,
          thumbnailView: false,
          defaultTemplate: 68,
          ignoreForDateSearch: false,
          ignoreForDigitalAsset: false,
          collapseNestedChildren: false,
          ignoreForLocationSearch: false,
        },
        display: true,
        displayInPreview: true,
        required: false,
        searchable: true,
        directSearch: false,
        clickToSearch: false,
        clickToSearchType: 1,
        viewOrder: 6,
        templateOrder: 6,
      },
      {
        widgetId: 45312,
        type: "select",
        allowMultiple: false,
        attemptAutocomplete: false,
        fieldTitle: "globalsearch_1",
        label: "Global Search",
        tooltip: "",
        fieldData: {
          multiSelect: false,
          selectGroup: ["", "I Agree"],
        },
        display: true,
        displayInPreview: false,
        required: false,
        searchable: false,
        directSearch: false,
        clickToSearch: true,
        clickToSearchType: 0,
        viewOrder: 7,
        templateOrder: 7,
      },
      {
        widgetId: 45313,
        type: "tag list",
        allowMultiple: false,
        attemptAutocomplete: false,
        fieldTitle: "sometags_1",
        label: "Some tags",
        tooltip: "",
        fieldData: [],
        display: true,
        displayInPreview: false,
        required: false,
        searchable: false,
        directSearch: false,
        clickToSearch: false,
        clickToSearchType: 1,
        viewOrder: 8,
        templateOrder: 8,
      },
      {
        widgetId: 45314,
        type: "text area",
        allowMultiple: false,
        attemptAutocomplete: false,
        fieldTitle: "bigtext_1",
        label: "Big Text",
        tooltip: "",
        fieldData: [],
        display: true,
        displayInPreview: false,
        required: false,
        searchable: false,
        directSearch: false,
        clickToSearch: false,
        clickToSearchType: 1,
        viewOrder: 9,
        templateOrder: 9,
      },
      {
        widgetId: 45315,
        type: "upload",
        allowMultiple: true,
        attemptAutocomplete: false,
        fieldTitle: "image_1",
        label: "Image",
        tooltip: "",
        fieldData: {
          extractDate: true,
          forceTiling: false,
          enableDendro: false,
          enableIframe: false,
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
        viewOrder: 10,
        templateOrder: 10,
      },
      {
        widgetId: 45316,
        type: "related asset",
        allowMultiple: true,
        attemptAutocomplete: false,
        fieldTitle: "collapsedjoinrecord_1",
        label: "Collapsed Join Record",
        tooltip: "",
        fieldData: {
          nestData: true,
          showLabel: true,
          matchAgainst: [72],
          displayInline: true,
          thumbnailView: false,
          defaultTemplate: 72,
          ignoreForDateSearch: false,
          ignoreForDigitalAsset: false,
          collapseNestedChildren: false,
          ignoreForLocationSearch: false,
        },
        display: true,
        displayInPreview: true,
        required: false,
        searchable: true,
        directSearch: false,
        clickToSearch: false,
        clickToSearchType: 1,
        viewOrder: 11,
        templateOrder: 11,
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

export function createTemplatesTable() {
  const baseTable = createBaseTable(
    (template: Template) => template.templateId,
    templateSeeds
  );

  return baseTable;
}

export type TemplatesTable = ReturnType<typeof createTemplatesTable>;
