import * as T from "@/types";
import { hasWidgetContent } from "@/helpers/hasWidgetContent";
import { isDateWidgetContent } from "@/types/guards";
import {
  computed,
  ComputedRef,
  inject,
  MaybeRefOrGetter,
  toValue,
} from "vue";
import { ASSET_VALIDATION_PROVIDE_KEY } from "@/constants/constants";
import invariant from "tiny-invariant";

interface WidgetValidation {
  id: T.WidgetInstanceId;
  label: T.WidgetDef["label"];
  isRequired: T.WidgetDef["required"];
  isEmpty: boolean;
  isValid: boolean;
  errors: ReturnType<typeof createErrorsObject>;
}

interface WidgetContentWithDef {
  content: T.WithId<T.WidgetContent>[];
  def: T.WidgetDef;
}

/** The errors one widget's validator found, keyed by content item and field. */
const createErrorsObject = () => {
  const errors = new Map<string, Map<string, string[]>>();

  const getItemFieldErrors = (itemId: string, fieldName: string): string[] =>
    errors.get(itemId)?.get(fieldName) ?? [];

  const addItemFieldError = (
    itemId: string,
    fieldName: string,
    error: string
  ): void => {
    const itemErrors = errors.get(itemId) ?? new Map<string, string[]>();
    itemErrors.set(fieldName, [...(itemErrors.get(fieldName) ?? []), error]);
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
  content: T.WithId<T.WidgetContent>[]
): ReturnType<typeof createErrorsObject> {
  const errors = createErrorsObject();

  content.forEach((contentItem) => {
    if (!isDateWidgetContent(contentItem)) {
      const error = "Not a date widget.";
      errors.addItemFieldError(contentItem.id, "global", error);
      return;
    }

    const { start, end } = contentItem;
    const hasStartText = !!start.text?.trim();
    // != null: an unparsable date leaves numeric null or undefined
    const isValidStart = hasStartText && start.numeric != null;

    if (hasStartText && !isValidStart) {
      errors.addItemFieldError(contentItem.id, "start", "Invalid start date.");
    }

    const hasEndText = !!end.text?.trim();
    const isValidEnd = !hasEndText || end.numeric != null;
    if (hasEndText && !isValidEnd) {
      errors.addItemFieldError(contentItem.id, "end", "Invalid end date");
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
        contentItem.id,
        "end",
        "End date must be after start date"
      );
    }
  });

  return errors;
}

function fallbackValidator({
  content,
  def,
  getWidgetInstanceId,
}: WidgetContentWithDef & {
  getWidgetInstanceId: (id: number) => T.WidgetInstanceId;
}) {
  const errors = createErrorsObject();
  const hasContent = hasWidgetContent(content, def.type);
  const id = getWidgetInstanceId(def.widgetId);
  if (!hasContent && def.required) {
    errors.addItemFieldError(id, "global", `${def.label} fields required.`);
  }
  return errors;
}

function validateWidget({
  content,
  def,
  getWidgetInstanceId,
}: WidgetContentWithDef & {
  getWidgetInstanceId: (id: number) => T.WidgetInstanceId;
}) {
  switch (def.type) {
    case "date":
      return validateDateWidget(content);
    default:
      return fallbackValidator({ content, def, getWidgetInstanceId });
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
  errors: ReturnType<typeof createErrorsObject>;
}): boolean {
  switch (def.type) {
    case "date":
      return content.every(
        (contentItem) => !errors.hasItemErrors(contentItem.id)
      );
    case "checkbox":
      return true; // unchecked OR checked is valid
    default:
      return hasWidgetContent(content, def.type);
  }
}

/**
 * Creates validation for a single widget
 */
function createWidgetValidation(
  widgetData: WidgetContentWithDef,
  getWidgetInstanceId: (id: number) => T.WidgetInstanceId
): WidgetValidation {
  const { content, def } = widgetData;
  const errors = validateWidget({ content, def, getWidgetInstanceId });

  return {
    id: getWidgetInstanceId(def.widgetId),
    label: def.label,
    isRequired: def.required,
    isEmpty: !hasWidgetContent(content, def.type),
    isValid: isWidgetValid({ content, def, errors }),
    errors,
  };
}

export interface AssetValidation {
  widgetValidations: ComputedRef<WidgetValidation[]>;
  isAssetValid: ComputedRef<boolean>;
  missingRequiredFields: ComputedRef<string[]>;
  invalidFields: ComputedRef<string[]>;
}

/** Every widget's validation for one asset against one template. Pure. */
export function validateAsset(
  asset: T.Asset | T.UnsavedAsset | null,
  template: T.Template | null,
  getWidgetInstanceId: (widgetId: T.WidgetDef["widgetId"]) => T.WidgetInstanceId
): WidgetValidation[] {
  return (template?.widgetArray ?? []).map((def) => {
    const content =
      (asset?.[def.fieldTitle] as T.WithId<T.WidgetContent>[]) || [];
    return createWidgetValidation({ content, def }, getWidgetInstanceId);
  });
}

/**
 * Validate one asset against its template, recomputing as either changes.
 * Derived directly from the model, so the Save button can never act on a
 * validity that lags the edit it is judging.
 *
 * Callers that have descendants needing these results pass the return value to
 * `provide(ASSET_VALIDATION_PROVIDE_KEY, ...)`, which `useAssetValidation`
 * reads.
 */
export function createAssetValidation(
  assetRefOrGetter: MaybeRefOrGetter<T.Asset | T.UnsavedAsset | null>,
  templateRefOrGetter: MaybeRefOrGetter<T.Template | null>,
  getWidgetInstanceId: (widgetId: T.WidgetDef["widgetId"]) => T.WidgetInstanceId
): AssetValidation {
  const asset = computed(() => toValue(assetRefOrGetter));
  const template = computed(() => toValue(templateRefOrGetter));

  const widgetValidations = computed(() =>
    validateAsset(asset.value, template.value, getWidgetInstanceId)
  );


  const isAssetValid = computed(() => {
    return widgetValidations.value.every(
      (validation) => !validation.isRequired || validation.isValid
    );
  });

  const missingRequiredFields = computed(() => {
    return widgetValidations.value
      .filter((validation) => validation.isRequired && validation.isEmpty)
      .map((validation) => validation.label);
  });

  const invalidFields = computed(() => {
    return widgetValidations.value
      .filter((validation) => !validation.isEmpty && !validation.isValid)
      .map((validation) => validation.label);
  });

  return {
    widgetValidations,
    isAssetValid,
    missingRequiredFields,
    invalidFields,
  };
}

export function useAssetValidation(): AssetValidation {
  const assetValidation = inject(ASSET_VALIDATION_PROVIDE_KEY);
  invariant(
    assetValidation,
    "useAssetValidation must be called under a component that provides ASSET_VALIDATION_PROVIDE_KEY"
  );
  return assetValidation;
}
