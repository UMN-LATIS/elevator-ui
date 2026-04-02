import type { Template, UploadWidgetDef } from "@/types";
import type { Exif } from "@/types/FileMetaDataTypes";

/**
 * Returns the `extractLocation` flag from the template's upload widget.
 * Defaults to true (show location) when the flag is absent, the template
 * has no upload widget, or the template itself is null.
 */
export function getExtractLocation(template: Template | null): boolean {
  if (!template) return true;

  const uploadWidget = template.widgetArray.find(
    (w): w is UploadWidgetDef => w.type === "upload"
  );

  return uploadWidget?.fieldData.extractLocation ?? true;
}

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
  const filtered: Exif = {};

  for (const [sectionKey, sectionValue] of Object.entries(exif)) {
    if (sectionValue && typeof sectionValue === "object") {
      filtered[sectionKey as keyof Exif] = omitGpsKeys(
        sectionValue as Record<string, unknown>
      ) as Exif[keyof Exif];
    }
  }

  return filtered;
}
