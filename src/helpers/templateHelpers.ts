import { WIDGET_TYPES, type Template, type UploadWidgetDef } from "@/types";
import type { Exif } from "@/types/FileMetaDataTypes";

/**
 * Returns the `extractLocation` flag from the template's upload widget.
 * Defaults to true (show location) when the flag is absent, the template
 * has no upload widget, or the template itself is null.
 */
export function shouldExtractLocation(template: Template | null): boolean {
  if (!template) return true;

  const uploadWidgetDef = template.widgetArray.find(
    (w): w is UploadWidgetDef => w.type === WIDGET_TYPES.UPLOAD
  );

  return uploadWidgetDef?.fieldData.extractLocation ?? true;
}

// EXIF GPS fields all share a "GPS" prefix (GPSLatitude, GPSLongitude,
// GPSAltitude, GPSSpeed, etc.) across every EXIF section (EXIF, Composite).
// Filtering by prefix strips all location data from the raw EXIF dump.
const GPS_KEY_PREFIX = "GPS";

function omitGpsKeys<T extends Record<string, unknown>>(
  section: Partial<T>
): Partial<T> {
  return Object.fromEntries(
    Object.entries(section).filter(([key]) => !key.startsWith(GPS_KEY_PREFIX))
  ) as Partial<T>;
}

/**
 * Returns a shallow copy of the EXIF object with all GPS-prefixed fields
 * removed from every section. Does not mutate the original.
 */
export function filterGpsFromExif(exif: Exif): Exif {
  // Each EXIF section (EXIF, Composite, File, etc.) is an object whose keys
  // we can filter. Non-object values are preserved as-is.
  return Object.fromEntries(
    Object.entries(exif).map(([key, section]) => [
      key,
      section && typeof section === "object"
        ? omitGpsKeys(section as Record<string, unknown>)
        : section,
    ])
  ) as Exif;
}
