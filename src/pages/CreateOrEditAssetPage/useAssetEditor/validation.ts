import * as T from "@/types";
import { hasWidgetContent } from "@/helpers/hasWidgetContent";
import { isDateWidgetContent, isLocationWidgetContent } from "@/types/guards";
import { isContentKeptByServer } from "./toStoredShape";
import { SessionWidgetId } from "./types";

export interface WidgetValidation {
  id: SessionWidgetId;
  label: T.WidgetDef["label"];
  isRequired: T.WidgetDef["required"];
  isEmpty: boolean;
  isValid: boolean;
  errors: WidgetErrors;
}

interface WidgetContentWithDef {
  content: T.WithUuid<T.WidgetContent>[];
  def: T.WidgetDef;
}

export type WidgetErrors = ReturnType<typeof createWidgetErrors>;

const createWidgetErrors = () => {
  const errors = new Map<string, Map<string, string[]>>();

  const getItemFieldErrors = (itemId: string, fieldName: string): string[] =>
    errors.get(itemId)?.get(fieldName) ?? [];

  const addItemFieldError = (
    itemId: string,
    fieldName: string,
    error: string
  ): void => {
    const itemErrors = errors.get(itemId) ?? new Map<string, string[]>();
    const fieldErrors = itemErrors.get(fieldName) ?? [];
    itemErrors.set(fieldName, [...fieldErrors, error]);
    errors.set(itemId, itemErrors);
  };

  const hasItemErrors = (itemId: string): boolean => {
    const itemErrors = errors.get(itemId);
    if (!itemErrors) return false;
    return [...itemErrors.values()].some(
      (fieldErrors) => fieldErrors.length > 0
    );
  };

  return { getItemFieldErrors, addItemFieldError, hasItemErrors };
};

function validateDateWidget(
  content: T.WithUuid<T.WidgetContent>[]
): WidgetErrors {
  const errors = createWidgetErrors();

  content.forEach((contentItem) => {
    if (!isDateWidgetContent(contentItem)) {
      const error = "Not a date widget.";
      errors.addItemFieldError(contentItem.uuid, "global", error);
      return;
    }

    const { start, end } = contentItem;
    const hasStartText = !!start.text?.trim();
    // != null: an unparsable date leaves numeric null or undefined
    const isValidStart = hasStartText && start.numeric != null;

    if (hasStartText && !isValidStart) {
      errors.addItemFieldError(
        contentItem.uuid,
        "start",
        "Invalid start date."
      );
    }

    const hasEndText = !!end.text?.trim();
    const isValidEnd = !hasEndText || end.numeric != null;
    if (hasEndText && !isValidEnd) {
      errors.addItemFieldError(contentItem.uuid, "end", "Invalid end date");
    }

    const isStartAfterEnd =
      hasStartText &&
      hasEndText &&
      isValidStart &&
      isValidEnd &&
      start.numeric &&
      end.numeric &&
      BigInt(start.numeric) > BigInt(end.numeric);

    if (isStartAfterEnd) {
      errors.addItemFieldError(
        contentItem.uuid,
        "end",
        "End date must be after start date"
      );
    }

    // the backend keeps a date row only for a label or a start, so an
    // end-only row reaches the server and is thrown away
    const isRowDropped = !isContentKeptByServer(
      contentItem,
      T.WIDGET_TYPES.DATE
    );
    if (hasEndText && isRowDropped) {
      errors.addItemFieldError(
        contentItem.uuid,
        "start",
        "Add a start date or a label, or this date is not saved."
      );
    }
  });

  return errors;
}

/**
 * An address the user typed is only stored alongside a label or coordinates,
 * so warn before a save throws the row away.
 */
function validateLocationWidget({
  content,
  def,
  getSessionWidgetId,
}: WidgetContentWithDef & {
  getSessionWidgetId: (id: number) => SessionWidgetId;
}): WidgetErrors {
  const errors = validateRequiredWidget({ content, def, getSessionWidgetId });

  content.forEach((contentItem) => {
    if (!isLocationWidgetContent(contentItem)) return;

    const hasAddressText = !!contentItem.address?.trim();
    const isRowDropped = !isContentKeptByServer(
      contentItem,
      T.WIDGET_TYPES.LOCATION
    );

    if (hasAddressText && isRowDropped) {
      errors.addItemFieldError(
        contentItem.uuid,
        "address",
        "Pick a point on the map or add a label, or this address is not saved."
      );
    }
  });

  return errors;
}

function validateRequiredWidget({
  content,
  def,
  getSessionWidgetId,
}: WidgetContentWithDef & {
  getSessionWidgetId: (id: number) => SessionWidgetId;
}) {
  const errors = createWidgetErrors();
  const hasContent = hasWidgetContent(content, def.type);
  const id = getSessionWidgetId(def.widgetId);
  if (!hasContent && def.required) {
    errors.addItemFieldError(id, "global", `${def.label} fields required.`);
  }
  return errors;
}

function validateWidget({
  content,
  def,
  getSessionWidgetId,
}: WidgetContentWithDef & {
  getSessionWidgetId: (id: number) => SessionWidgetId;
}) {
  switch (def.type) {
    case "date":
      return validateDateWidget(content);
    case "location":
      return validateLocationWidget({ content, def, getSessionWidgetId });
    default:
      return validateRequiredWidget({ content, def, getSessionWidgetId });
  }
}

/**
 * @param errors - what `validateWidget` already found for this widget, so a
 * date widget is not validated a second time here.
 */
function isWidgetValid({
  content,
  def,
  errors,
}: WidgetContentWithDef & {
  errors: WidgetErrors;
}): boolean {
  switch (def.type) {
    case "date":
      return content.every(
        (contentItem) => !errors.hasItemErrors(contentItem.uuid)
      );
    case "checkbox":
      return true; // unchecked OR checked is valid
    default:
      return hasWidgetContent(content, def.type);
  }
}

function createWidgetValidation(
  widgetData: WidgetContentWithDef,
  getSessionWidgetId: (id: number) => SessionWidgetId
): WidgetValidation {
  const { content, def } = widgetData;
  const errors = validateWidget({ content, def, getSessionWidgetId });

  return {
    id: getSessionWidgetId(def.widgetId),
    label: def.label,
    isRequired: def.required,
    isEmpty: !hasWidgetContent(content, def.type),
    isValid: isWidgetValid({ content, def, errors }),
    errors,
  };
}

/** Every widget's validation for one asset against one template. Pure. */
export function validateAsset(
  asset: T.Asset | T.UnsavedAsset | null,
  template: T.Template | null,
  getSessionWidgetId: (widgetId: T.WidgetDef["widgetId"]) => SessionWidgetId
): WidgetValidation[] {
  return (template?.widgetArray ?? []).map((def) => {
    const content =
      (asset?.[def.fieldTitle] as T.WithUuid<T.WidgetContent>[]) || [];
    return createWidgetValidation({ content, def }, getSessionWidgetId);
  });
}

export function areRequiredWidgetsValid(
  widgetValidations: WidgetValidation[]
): boolean {
  return widgetValidations.every(
    (validation) => !validation.isRequired || validation.isValid
  );
}

export function missingRequiredFieldLabels(
  widgetValidations: WidgetValidation[]
): string[] {
  return widgetValidations
    .filter((validation) => validation.isRequired && validation.isEmpty)
    .map((validation) => validation.label);
}

export function invalidFieldLabels(
  widgetValidations: WidgetValidation[]
): string[] {
  return widgetValidations
    .filter((validation) => !validation.isEmpty && !validation.isValid)
    .map((validation) => validation.label);
}
