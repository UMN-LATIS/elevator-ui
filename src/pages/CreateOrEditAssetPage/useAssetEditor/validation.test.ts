import { describe, it, expect } from "vitest";
import { validateAsset } from "./validation";
import type { Template, UnsavedAsset, WidgetInstanceId } from "@/types";

const getWidgetInstanceId = (widgetId: number): WidgetInstanceId =>
  `editor-${widgetId}` as WidgetInstanceId;

const makeTemplate = (widgetArray: Record<string, unknown>[]): Template =>
  ({
    templateId: 1,
    widgetArray: widgetArray.map((widget, index) => ({
      widgetId: index + 1,
      type: "text",
      fieldTitle: `field_${index + 1}`,
      label: `Field ${index + 1}`,
      required: false,
      ...widget,
    })),
  } as unknown as Template);

const makeAsset = (fields: Record<string, unknown> = {}): UnsavedAsset =>
  ({
    assetId: null,
    templateId: 1,
    readyForDisplay: false,
    collectionId: 1,
    availableAfter: null,
    modified: null,
    modifiedBy: 1,
    createdBy: 1,
    deletedBy: null,
    relatedAssetCache: null,
    ...fields,
  } as UnsavedAsset);

describe("validateAsset", () => {
  it("reads an empty text widget as empty and a filled one as valid", () => {
    const template = makeTemplate([{}]);
    const emptyAsset = makeAsset({
      field_1: [{ uuid: "row-1", fieldContents: "", isPrimary: false }],
    });
    const filledAsset = makeAsset({
      field_1: [{ uuid: "row-1", fieldContents: "typed", isPrimary: false }],
    });

    expect(
      validateAsset(emptyAsset, template, getWidgetInstanceId)[0]
    ).toMatchObject({ isEmpty: true, isValid: false });
    expect(
      validateAsset(filledAsset, template, getWidgetInstanceId)[0]
    ).toMatchObject({ isEmpty: false, isValid: true });
  });

  it("marks a required empty widget invalid with a global error", () => {
    const template = makeTemplate([{ required: true }]);
    const asset = makeAsset({
      field_1: [{ uuid: "row-1", fieldContents: "", isPrimary: false }],
    });

    const [validation] = validateAsset(asset, template, getWidgetInstanceId);
    expect(validation.isRequired).toBe(true);
    expect(validation.isValid).toBe(false);
    expect(
      validation.errors.getItemFieldErrors(getWidgetInstanceId(1), "global")
    ).toEqual(["Field 1 fields required."]);
  });

  it("accepts a date with a start and rejects a start after its end", () => {
    const template = makeTemplate([{ type: "date" }]);
    const inOrderAsset = makeAsset({
      field_1: [
        {
          uuid: "row-1",
          label: "",
          start: { text: "2020", numeric: "1577836800" },
          end: { text: "2021", numeric: "1609459200" },
        },
      ],
    });
    const reversedDatesAsset = makeAsset({
      field_1: [
        {
          uuid: "row-1",
          label: "",
          start: { text: "2021", numeric: "1609459200" },
          end: { text: "2020", numeric: "1577836800" },
        },
      ],
    });

    expect(
      validateAsset(inOrderAsset, template, getWidgetInstanceId)[0].isValid
    ).toBe(true);

    const [reversedValidation] = validateAsset(
      reversedDatesAsset,
      template,
      getWidgetInstanceId
    );
    expect(reversedValidation.isValid).toBe(false);
    expect(
      reversedValidation.errors.getItemFieldErrors("row-1", "end")
    ).toEqual(["End date must be after start date"]);
  });

  it("rejects a date whose text never parsed", () => {
    const template = makeTemplate([{ type: "date" }]);
    const asset = makeAsset({
      field_1: [
        {
          uuid: "row-1",
          label: "",
          start: { text: "not a date", numeric: null },
          end: { text: null, numeric: null },
        },
      ],
    });

    const [validation] = validateAsset(asset, template, getWidgetInstanceId);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.getItemFieldErrors("row-1", "start")).toEqual([
      "Invalid start date.",
    ]);
  });

  it("warns that an end date with no start is not saved", () => {
    const template = makeTemplate([{ type: "date" }]);
    const asset = makeAsset({
      field_1: [
        {
          uuid: "row-1",
          label: "",
          start: { text: null, numeric: null },
          end: { text: "2021", numeric: "1609459200" },
        },
      ],
    });

    const [validation] = validateAsset(asset, template, getWidgetInstanceId);
    expect(validation.errors.getItemFieldErrors("row-1", "start")).toEqual([
      "Add a start date or a label, or this date is not saved.",
    ]);
    expect(validation.isValid).toBe(false);
  });

  it("keeps an end date with no start when the row has a label", () => {
    const template = makeTemplate([{ type: "date" }]);
    const asset = makeAsset({
      field_1: [
        {
          uuid: "row-1",
          label: "Published",
          start: { text: null, numeric: null },
          end: { text: "2021", numeric: "1609459200" },
        },
      ],
    });

    const [validation] = validateAsset(asset, template, getWidgetInstanceId);
    expect(validation.errors.getItemFieldErrors("row-1", "start")).toEqual([]);
    expect(validation.isValid).toBe(true);
  });

  it("warns that an address with no coordinates is not saved", () => {
    const template = makeTemplate([{ type: "location" }]);
    const asset = makeAsset({
      field_1: [
        {
          uuid: "row-1",
          locationLabel: "",
          address: "117 Pleasant St SE, Minneapolis",
          loc: undefined,
        },
      ],
    });

    const [validation] = validateAsset(asset, template, getWidgetInstanceId);
    expect(validation.errors.getItemFieldErrors("row-1", "address")).toEqual([
      "Pick a point on the map or add a label, or this address is not saved.",
    ]);
  });

  it("accepts an address once the row has coordinates", () => {
    const template = makeTemplate([{ type: "location" }]);
    const asset = makeAsset({
      field_1: [
        {
          uuid: "row-1",
          locationLabel: "",
          address: "117 Pleasant St SE, Minneapolis",
          loc: { type: "Point", coordinates: [-93.235, 44.974] },
        },
      ],
    });

    const [validation] = validateAsset(asset, template, getWidgetInstanceId);
    expect(validation.errors.getItemFieldErrors("row-1", "address")).toEqual(
      []
    );
  });

  it("reports one widget per template, so a smaller template reports fewer", () => {
    const asset = makeAsset({
      field_1: [{ uuid: "row-1", fieldContents: "kept", isPrimary: false }],
      field_2: [{ uuid: "row-2", fieldContents: "dropped", isPrimary: false }],
    });

    expect(
      validateAsset(asset, makeTemplate([{}, {}]), getWidgetInstanceId)
    ).toHaveLength(2);

    const [validation] = validateAsset(
      asset,
      makeTemplate([{}]),
      getWidgetInstanceId
    );
    expect(validation.id).toBe(getWidgetInstanceId(1));
  });

  it("returns nothing without a template", () => {
    expect(validateAsset(makeAsset(), null, getWidgetInstanceId)).toEqual([]);
  });
});
