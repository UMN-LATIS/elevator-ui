import * as T from "@/types";
import { hasWidgetContent } from "@/helpers/hasWidgetContent";
import { isDateWidgetContent } from "@/types/guards";

export interface WidgetValidationResult {
  isValid: boolean;
  errors: string[];
  hasContent: boolean;
  fieldErrors: Map<string, Map<string, string[]>>; // contentId -> Map<fieldName, errors[]>
}

/**
 * Validates a single widget's content
 */
export function validateWidget(
  widgetDef: T.WidgetDef,
  widgetContents: T.WithId<T.WidgetContent>[]
): WidgetValidationResult {
  const hasContent = hasWidgetContent(widgetContents, widgetDef.type);
  const fieldErrors = new Map<string, Map<string, string[]>>();
  const errors: string[] = [];

  // Only validate content if there's actually content to validate
  if (hasContent) {
    const contentValidation = validateWidgetContent(widgetContents, widgetDef.type);
    errors.push(...contentValidation.errors);
    contentValidation.fieldErrors.forEach((fieldMap, contentId) => 
      fieldErrors.set(contentId, fieldMap)
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    hasContent,
    fieldErrors,
  };
}

/**
 * Validates widget content based on widget type
 */
function validateWidgetContent(
  contents: T.WithId<T.WidgetContent>[],
  widgetType: T.WidgetDef["type"]
): { errors: string[]; fieldErrors: Map<string, Map<string, string[]>> } {
  const errors: string[] = [];
  const fieldErrors = new Map<string, Map<string, string[]>>();

  if (widgetType === "date") {
    contents.forEach((content) => {
      if (!isDateWidgetContent(content)) return;

      const contentErrorMap = new Map<string, string[]>();

      const hasStartText = !!content.start.text?.trim();
      const hasEndText = !!content.end.text?.trim();
      const isValidStart = hasStartText && content.start.numeric !== null;
      const isValidEnd = !hasEndText || content.end.numeric !== null;

      if (hasStartText && !isValidStart) {
        const error = "Invalid start date";
        errors.push(error);
        contentErrorMap.set("startDate", [error]);
      }

      if (hasEndText && !isValidEnd) {
        const error = "Invalid end date";
        errors.push(error);
        contentErrorMap.set("endDate", [error]);
      }

      if (
        hasStartText &&
        hasEndText &&
        isValidStart &&
        isValidEnd &&
        content.start.numeric &&
        content.end.numeric &&
        BigInt(content.start.numeric) > BigInt(content.end.numeric)
      ) {
        const error = "End date must be after start date";
        errors.push(error);
        
        // Add to endDate errors (or create new array if doesn't exist)
        const existingEndErrors = contentErrorMap.get("endDate") || [];
        contentErrorMap.set("endDate", [...existingEndErrors, error]);
      }

      // Only add to fieldErrors if there are actually errors for this content
      if (contentErrorMap.size > 0) {
        fieldErrors.set(content.id, contentErrorMap);
      }
    });
  }

  // Add other widget type validations here
  // if (widgetType === "location") { ... }

  return { errors, fieldErrors };
}

/**
 * Gets missing required fields from an asset
 */
export function getMissingRequiredFields(
  asset: T.Asset | T.UnsavedAsset,
  template: T.Template
): string[] {
  const missing: string[] = [];

  template.widgetArray.forEach((widgetDef) => {
    if (!widgetDef.required) return;

    const widgetContents = (asset[widgetDef.fieldTitle] ?? []) as T.WithId<T.WidgetContent>[];
    const hasContent = hasWidgetContent(widgetContents, widgetDef.type);

    if (!hasContent) {
      missing.push(widgetDef.label);
    }
  });

  return missing;
}

/**
 * Gets invalid fields from an asset
 */
export function getInvalidFields(
  asset: T.Asset | T.UnsavedAsset,
  template: T.Template
): string[] {
  const invalid: string[] = [];

  template.widgetArray.forEach((widgetDef) => {
    const widgetContents = (asset[widgetDef.fieldTitle] ?? []) as T.WithId<T.WidgetContent>[];
    const validation = validateWidget(widgetDef, widgetContents);

    if (validation.hasContent && !validation.isValid) {
      invalid.push(widgetDef.label);
    }
  });

  return invalid;
}

/**
 * Checks if the entire form is valid
 */
export function isFormValid(
  asset: T.Asset | T.UnsavedAsset,
  template: T.Template
): boolean {
  const missingRequired = getMissingRequiredFields(asset, template);
  const invalidFields = getInvalidFields(asset, template);
  
  return missingRequired.length === 0 && invalidFields.length === 0;
}