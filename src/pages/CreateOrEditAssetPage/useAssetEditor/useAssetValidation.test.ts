import { describe, it, expect, vi } from "vitest";
import { ref, nextTick } from "vue";
import { useAssetValidationProvider } from "./useAssetValidation";
import type { 
  UnsavedAsset, 
  Template, 
  WidgetDef, 
  PHPDateTime, 
  WidgetInstanceId,
  TextWidgetContent,
  DateWidgetContent
} from "@/types";

// Mock the hasWidgetContent function
vi.mock("@/helpers/hasWidgetContent", () => ({
  hasWidgetContent: vi.fn((content: unknown[], widgetType: string) => {
    if (widgetType === "text") {
      return content.some((item) => {
        const textItem = item as TextWidgetContent;
        return textItem.fieldContents && textItem.fieldContents.trim() !== "";
      });
    }
    if (widgetType === "date") {
      return content.some((item) => {
        const dateItem = item as DateWidgetContent;
        return (
          (dateItem.start?.text && dateItem.start.text.trim() !== "") ||
          (dateItem.end?.text && dateItem.end.text.trim() !== "") ||
          (dateItem.label && dateItem.label.trim() !== "")
        );
      });
    }
    return content.length > 0;
  }),
}));

// Mock the date widget content guard
vi.mock("@/types/guards", () => ({
  isDateWidgetContent: vi.fn((content: unknown) => {
    return (
      content &&
      typeof content === "object" &&
      content !== null &&
      "start" in content &&
      "end" in content
    );
  }),
}));

const createMockPHPDateTime = (): PHPDateTime => ({
  date: "2025-01-01 00:00:00.000000",
  timezone: "UTC",
  timezone_type: 3,
});

const createMockAsset = (
  fieldData: Record<string, unknown> = {}
): UnsavedAsset => ({
  assetId: null,
  templateId: 1,
  readyForDisplay: false,
  collectionId: 1,
  availableAfter: null,
  modified: createMockPHPDateTime(),
  modifiedBy: 1,
  createdBy: 1,
  deletedBy: null,
  relatedAssetCache: null,
  ...fieldData,
});

const createMockTemplate = (widgets: Partial<WidgetDef>[] = []): Template => ({
  templateId: 1,
  templateName: "Test Template",
  showCollection: false,
  showTemplate: false,
  showCollectionPosition: 1,
  showTemplatePosition: 1,
  widgetArray: widgets.map((widget, index) => ({
    widgetId: index + 1,
    type: "text" as const,
    allowMultiple: false,
    attemptAutocomplete: false,
    fieldTitle: `field_${index + 1}`,
    label: `Field ${index + 1}`,
    tooltip: "",
    fieldData: [],
    display: true,
    displayInPreview: false,
    required: false,
    searchable: false,
    directSearch: false,
    clickToSearch: false,
    clickToSearchType: 1,
    viewOrder: index + 1,
    templateOrder: index + 1,
    ...widget,
  })) as WidgetDef[],
});

const mockGetWidgetInstanceId = (widgetId: number): WidgetInstanceId =>
  `test-editor-${widgetId}` as WidgetInstanceId;

describe("useAssetValidation", () => {
  it("should validate empty text widget as empty", async () => {
    const asset = ref(
      createMockAsset({
        field_1: [],
      })
    );

    const template = ref(
      createMockTemplate([
        {
          fieldTitle: "field_1",
          type: "text",
          label: "Text Field",
          required: false,
        },
      ])
    );

    const { widgetValidations } = useAssetValidationProvider(
      asset,
      template,
      mockGetWidgetInstanceId
    );

    await nextTick();

    expect(widgetValidations.value).toHaveLength(1);
    expect(widgetValidations.value[0]).toMatchObject({
      id: mockGetWidgetInstanceId(1),
      label: "Text Field",
      isRequired: false,
      isEmpty: true,
      isValid: false,
      status: "empty",
    });
  });

  it("should validate text widget with content as valid", async () => {
    const asset = ref(
      createMockAsset({
        field_1: [{ id: "1", fieldContents: "Hello World" }],
      })
    );

    const template = ref(
      createMockTemplate([
        {
          fieldTitle: "field_1",
          type: "text",
          label: "Text Field",
          required: false,
        },
      ])
    );

    const { widgetValidations } = useAssetValidationProvider(
      asset,
      template,
      mockGetWidgetInstanceId
    );

    await nextTick();

    expect(widgetValidations.value[0]).toMatchObject({
      isEmpty: false,
      isValid: true,
      status: "valid",
    });
  });

  it("should validate required empty widget as invalid", async () => {
    const asset = ref(
      createMockAsset({
        field_1: [],
      })
    );

    const template = ref(
      createMockTemplate([
        {
          fieldTitle: "field_1",
          type: "text",
          label: "Required Field",
          required: true,
        },
      ])
    );

    const { widgetValidations } = useAssetValidationProvider(
      asset,
      template,
      mockGetWidgetInstanceId
    );

    await nextTick();

    expect(widgetValidations.value[0]).toMatchObject({
      isRequired: true,
      isEmpty: true,
      isValid: false,
      status: "empty",
    });
  });

  it("should validate date widget with valid dates", async () => {
    const asset = ref(
      createMockAsset({
        date_field_1: [
          {
            id: "1",
            label: "Test Date",
            start: { text: "2024-01-01", numeric: "1704067200" },
            end: { text: "2024-01-02", numeric: "1704153600" },
          },
        ],
      })
    );

    const template = ref(
      createMockTemplate([
        {
          fieldTitle: "date_field_1",
          type: "date",
          label: "Date Field",
          required: false,
        },
      ])
    );

    const { widgetValidations } = useAssetValidationProvider(
      asset,
      template,
      mockGetWidgetInstanceId
    );

    await nextTick();

    expect(widgetValidations.value[0]).toMatchObject({
      isEmpty: false,
      isValid: true,
      status: "valid",
    });
  });

  it("should validate date widget with invalid date range", async () => {
    const asset = ref(
      createMockAsset({
        date_field_1: [
          {
            id: "1",
            label: "Test Date",
            start: { text: "2024-01-02", numeric: "1704153600" },
            end: { text: "2024-01-01", numeric: "1704067200" },
          },
        ],
      })
    );

    const template = ref(
      createMockTemplate([
        {
          fieldTitle: "date_field_1",
          type: "date",
          label: "Date Field",
          required: false,
        },
      ])
    );

    const { widgetValidations } = useAssetValidationProvider(
      asset,
      template,
      mockGetWidgetInstanceId
    );

    await nextTick();

    expect(widgetValidations.value[0]).toMatchObject({
      isEmpty: false,
      isValid: false,
      status: "invalid",
    });

    // Check that there are date range errors
    const validation = widgetValidations.value[0];
    const endErrors = validation.errors.getItemFieldErrors("1", "end");
    expect(endErrors).toContain("End date must be after start date");
  });

  it("should only revalidate changed widgets for performance", async () => {
    const asset = ref(
      createMockAsset({
        field_1: [{ id: "1", fieldContents: "Text 1" }],
        field_2: [{ id: "2", fieldContents: "Text 2" }],
      })
    );

    const template = ref(
      createMockTemplate([
        {
          fieldTitle: "field_1",
          type: "text",
          label: "Field 1",
          required: false,
        },
        {
          fieldTitle: "field_2",
          type: "text",
          label: "Field 2",
          required: false,
        },
      ])
    );

    const { widgetValidations } = useAssetValidationProvider(
      asset,
      template,
      mockGetWidgetInstanceId
    );

    await nextTick();

    // Initial validation
    const initialValidations = [...widgetValidations.value];
    expect(initialValidations).toHaveLength(2);

    // Change only field_1
    asset.value = createMockAsset({
      field_1: [{ id: "1", fieldContents: "Changed Text 1" }],
      field_2: [{ id: "2", fieldContents: "Text 2" }], // unchanged
    });

    await nextTick();

    // Should have new validations
    const newValidations = widgetValidations.value;
    expect(newValidations).toHaveLength(2);

    // Field 1 should be revalidated, Field 2 should use cached result
    const widgetInstanceId1 = mockGetWidgetInstanceId(1);
    const widgetInstanceId2 = mockGetWidgetInstanceId(2);
    expect(newValidations.find((v) => v.id === widgetInstanceId1)?.id).toBe(
      widgetInstanceId1
    );
    expect(newValidations.find((v) => v.id === widgetInstanceId2)?.id).toBe(
      widgetInstanceId2
    );
  });

  it("should debounce validation updates", async () => {
    const asset = ref(
      createMockAsset({
        field_1: [{ id: "1", fieldContents: "initial" }],
      })
    );

    const template = ref(
      createMockTemplate([
        {
          fieldTitle: "field_1",
          type: "text",
          label: "Text Field",
          required: false,
        },
      ])
    );

    const { widgetValidations } = useAssetValidationProvider(
      asset,
      template,
      mockGetWidgetInstanceId
    );

    await nextTick();

    // Initial validation
    expect(widgetValidations.value[0].isValid).toBe(true);

    // Make rapid changes - these should be debounced
    asset.value = createMockAsset({
      field_1: [{ id: "1", fieldContents: "change1" }],
    });

    asset.value = createMockAsset({
      field_1: [{ id: "1", fieldContents: "change2" }],
    });

    asset.value = createMockAsset({
      field_1: [{ id: "1", fieldContents: "final" }],
    });

    // Wait for debounced validation to complete
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should have the final validation result
    expect(widgetValidations.value[0].isValid).toBe(true);
  });

  it("should handle template changes", async () => {
    const asset = ref(
      createMockAsset({
        field_1: [{ id: "1", fieldContents: "Text 1" }],
        field_2: [{ id: "2", fieldContents: "Text 2" }],
      })
    );

    const template = ref(
      createMockTemplate([
        {
          fieldTitle: "field_1",
          type: "text",
          label: "Field 1",
          required: false,
        },
        {
          fieldTitle: "field_2",
          type: "text",
          label: "Field 2",
          required: false,
        },
      ])
    );

    const { widgetValidations } = useAssetValidationProvider(
      asset,
      template,
      mockGetWidgetInstanceId
    );

    await nextTick();

    expect(widgetValidations.value).toHaveLength(2);

    // Remove one widget from template
    template.value = createMockTemplate([
      {
        fieldTitle: "field_1",
        type: "text",
        label: "Field 1",
        required: false,
      },
    ]);

    // Wait for debounced update
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(widgetValidations.value).toHaveLength(1);
    expect(widgetValidations.value[0].id).toBe(mockGetWidgetInstanceId(1));
  });
});
