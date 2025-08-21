import * as T from "@/types";
import { hasWidgetContent } from "@/helpers/hasWidgetContent";
import { isDateWidgetContent } from "@/types/guards";
import {
  computed,
  ComputedRef,
  inject,
  MaybeRefOrGetter,
  provide,
  toValue,
  ref,
  watch,
} from "vue";
import { useDebounceFn } from "@vueuse/core";
import { ASSET_VALIDATION_PROVIDE_KEY } from "@/constants/constants";
import invariant from "tiny-invariant";

interface WidgetValidation {
  id: T.WidgetInstanceId;
  label: T.WidgetDef["label"];
  isRequired: T.WidgetDef["required"];
  isEmpty: boolean;
  isValid: boolean;
  status: "valid" | "invalid" | "empty";
  errors: ReturnType<typeof createErrorsObject>;
}

interface WidgetContentWithDef {
  content: T.WithId<T.WidgetContent>[];
  def: T.WidgetDef;
}

const createErrorsObject = () => {
  const errors = new Map<string, Map<string, string[]>>();

  const getItemErrors = (itemId: string) => {
    return errors.get(itemId) || new Map<string, string[]>();
  };

  const getItemFieldErrors = (itemId: string, fieldName: string) => {
    const itemErrors = errors.get(itemId);
    return itemErrors?.get(fieldName) || [];
  };

  const clearItemFieldErrors = (itemId: string, fieldName: string) => {
    const itemErrors = errors.get(itemId);
    if (itemErrors) {
      itemErrors.delete(fieldName);
    }
  };

  const clearItemErrors = (itemId: string) => {
    errors.delete(itemId);
  };

  const updateItemFieldErrors = (
    itemId: string,
    fieldName: string,
    fieldErrors: string[]
  ) => {
    if (!errors.has(itemId)) {
      errors.set(itemId, new Map<string, string[]>());
    }
    errors.get(itemId)!.set(fieldName, fieldErrors);
  };

  const hasItemErrors = (itemId: string) => {
    const itemErrors = errors.get(itemId);
    if (!itemErrors) return false;

    for (const fieldErrors of itemErrors.values()) {
      if (fieldErrors.length > 0) {
        return true;
      }
    }
    return false;
  };

  const addItemFieldError = (
    itemId: string,
    fieldname: string,
    error: string
  ) => {
    const itemFieldErrors = getItemFieldErrors(itemId, fieldname);
    updateItemFieldErrors(itemId, fieldname, [...itemFieldErrors, error]);
  };

  const hasItemFieldErrors = (itemId: string, fieldName: string) => {
    const fieldErrors = getItemFieldErrors(itemId, fieldName);
    return fieldErrors.length > 0;
  };

  const clearAll = () => {
    errors.clear();
  };

  return {
    getItemErrors,
    getItemFieldErrors,
    updateItemFieldErrors,
    addItemFieldError,
    clearItemErrors,
    clearItemFieldErrors,
    hasItemErrors,
    hasItemFieldErrors,
    clearAll,
  };
};

// Validation functions
function validateDateWidget({
  content,
  def: _def,
}: WidgetContentWithDef): ReturnType<typeof createErrorsObject> {
  const errors = createErrorsObject();

  content.forEach((contentItem) => {
    if (!isDateWidgetContent(contentItem)) {
      const error = "Not a date widget.";
      errors.addItemFieldError(contentItem.id, "global", error);
      return;
    }

    const { start, end } = contentItem;
    const hasStartText = !!start.text?.trim();
    const isValidStart = hasStartText && start.numeric !== null;

    if (hasStartText && !isValidStart) {
      errors.addItemFieldError(contentItem.id, "start", "Invalid start date.");
    }

    const hasEndText = !!end.text?.trim();
    const isValidEnd = !hasEndText || end.numeric !== null;
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
      return validateDateWidget({ content, def });
    default:
      return fallbackValidator({ content, def, getWidgetInstanceId });
  }
}

function isDateContentValid({ content, def }: WidgetContentWithDef) {
  const errors = validateDateWidget({ content, def });

  // Check if any content item has errors
  for (const contentItem of content) {
    if (errors.hasItemErrors(contentItem.id)) {
      return false;
    }
  }

  return true;
}

function isWidgetValid({ content, def }: WidgetContentWithDef): boolean {
  switch (def.type) {
    case "date":
      return isDateContentValid({ content, def });
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
  const isValid = isWidgetValid({ content, def });
  const isEmpty = !hasWidgetContent(content, def.type);
  const status = isValid ? "valid" : isEmpty ? "empty" : "invalid";

  return {
    id: getWidgetInstanceId(def.widgetId),
    label: def.label,
    isRequired: def.required,
    isEmpty,
    isValid,
    status,
    errors,
  };
}

/**
 * Simple asset validation provider
 */
export function useAssetValidationProvider(
  assetRefOrGetter: MaybeRefOrGetter<T.Asset | T.UnsavedAsset | null>,
  templateRefOrGetter: MaybeRefOrGetter<T.Template | null>,
  getWidgetInstanceId: (widgetId: T.WidgetDef["widgetId"]) => T.WidgetInstanceId
): {
  widgetValidations: ComputedRef<WidgetValidation[]>;
  widgetIdsWithContent: ComputedRef<T.WidgetDef["widgetId"][]>;
  isBlank: ComputedRef<boolean>;
  isAssetValid: ComputedRef<boolean>;
  missingRequiredFields: ComputedRef<string[]>;
  invalidFields: ComputedRef<string[]>;
} {
  const asset = computed(() => toValue(assetRefOrGetter));
  const template = computed(() => toValue(templateRefOrGetter));
  const widgetDefs = computed(() => template.value?.widgetArray ?? []);

  // storing validation results as ref instead of
  // computed so that we can debounce
  const validationResults = ref<WidgetValidation[]>([]);

  const computeValidations = () => {
    const results: WidgetValidation[] = [];

    widgetDefs.value.forEach((def) => {
      const content =
        (asset.value?.[def.fieldTitle] as T.WithId<T.WidgetContent>[]) || [];
      const validation = createWidgetValidation(
        { content, def },
        getWidgetInstanceId
      );
      results.push(validation);
    });

    validationResults.value = results;
  };

  // Debounce validation computation to reduce excessive recalculation during rapid typing
  const debouncedComputeValidations = useDebounceFn(computeValidations, 100);

  // Watch for changes and trigger debounced validation
  watch(
    [asset, widgetDefs],
    () => {
      debouncedComputeValidations();
    },
    { deep: true }
  );

  // Run initial validation immediately
  computeValidations();

  // Return computed that just returns the current results
  const widgetValidations = computed(() => validationResults.value);

  const widgetIdsWithContent = computed((): T.WidgetDef["widgetId"][] => {
    if (!template.value || !asset.value) return [];

    return template.value.widgetArray
      .filter((widgetDef) => {
        const widgetContents = (asset.value?.[widgetDef.fieldTitle] ??
          []) as T.WithId<T.WidgetContent>[];
        return hasWidgetContent(widgetContents, widgetDef.type);
      })
      .map((widgetDef) => widgetDef.widgetId);
  });

  const isBlank = computed((): boolean => {
    if (!asset.value || !template.value) return true;
    return widgetIdsWithContent.value.length === 0;
  });

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

  provide(ASSET_VALIDATION_PROVIDE_KEY, {
    widgetValidations,
    widgetIdsWithContent,
    isBlank,
    isAssetValid,
    missingRequiredFields,
    invalidFields,
  });

  return {
    widgetValidations,
    widgetIdsWithContent,
    isBlank,
    isAssetValid,
    missingRequiredFields,
    invalidFields,
  };
}

export function useAssetValidation() {
  const assetValidation = inject(ASSET_VALIDATION_PROVIDE_KEY);
  invariant(
    assetValidation,
    "useAssetValidation must be used within a component (or parent) that calls useAssetValidationProvider"
  );
  return assetValidation;
}