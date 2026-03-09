import { Hono } from "hono";
import type { MockServerContext } from "../types";
import type {
  TemplateSummary,
  AdminTemplate,
  AdminWidgetDef,
  WidgetType,
} from "../../src/types";
import { FIELD_TYPE_IDS, type AdminTemplateSeed } from "../db/templates";
import type { createTemplatesTable } from "../db/templates";

// Mock instance ID used for fieldTitle generation — mirrors real backend behavior.
const MOCK_INSTANCE_ID = 1;

const app = new Hono<MockServerContext>({ strict: false });

/** Map a stored template seed to the AdminTemplate response shape. */
function toAdminTemplateResponse(template: AdminTemplateSeed): AdminTemplate {
  const sortedWidgets = [...template.widgetArray].sort(
    (a, b) => a.templateOrder - b.templateOrder
  );

  return {
    id: template.templateId,
    name: template.templateName,
    createdAt: template.createdAt,
    modifiedAt: template.modifiedAt,
    showCollection: template.showCollection,
    showCollectionPosition: template.showCollectionPosition,
    showTemplate: template.showTemplate,
    showTemplatePosition: template.showTemplatePosition,
    includeInSearch: template.includeInSearch,
    indexForSearching: template.indexForSearching,
    isHidden: template.isHidden,
    templateColor: template.templateColor,
    recursiveIndexDepth: template.recursiveIndexDepth,
    widgetArray: sortedWidgets.map(
      (w): AdminWidgetDef => ({
        widgetId: w.widgetId,
        fieldTitle: w.fieldTitle,
        fieldType: w.type,
        fieldTypeId: FIELD_TYPE_IDS[w.type],
        label: w.label,
        tooltip: w.tooltip,
        templateOrder: w.templateOrder,
        viewOrder: w.viewOrder,
        display: w.display,
        displayInPreview: w.displayInPreview,
        required: w.required,
        searchable: w.searchable,
        allowMultiple: w.allowMultiple,
        attemptAutocomplete: w.attemptAutocomplete,
        directSearch: w.directSearch,
        clickToSearch: w.clickToSearch,
        clickToSearchType: w.clickToSearchType,
        fieldData: w.fieldData,
      })
    ),
  };
}

/** Resolve a WidgetType string from a fieldTypeId integer. */
function fieldTypeFromId(fieldTypeId: number): WidgetType {
  const entry = Object.entries(FIELD_TYPE_IDS).find(
    ([, id]) => id === fieldTypeId
  );
  return (entry?.[0] as WidgetType | undefined) ?? "text";
}

/** Generate a fieldTitle from a label string, matching backend logic. */
function generateFieldTitle(label: string): string {
  const slug = label.replace(/[^a-z0-9_]/gi, "").toLowerCase() || "field";
  return `${slug}_${MOCK_INSTANCE_ID}`;
}

// GET /templates/getFieldTypes — mirrors Templates::getFieldTypes() JSON path
app.get("/getFieldTypes", (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  return c.json([
    { id: 1, name: "text", modelName: "TextField", sampleFieldData: null },
    {
      id: 2,
      name: "text area",
      modelName: "TextAreaField",
      sampleFieldData: null,
    },
    {
      id: 3,
      name: "select",
      modelName: "SelectField",
      sampleFieldData: {
        multiSelect: false,
        selectGroup: ["option 1", "option 2", "option 3"],
      },
    },
    {
      id: 4,
      name: "checkbox",
      modelName: "CheckboxField",
      sampleFieldData: null,
    },
    { id: 5, name: "date", modelName: "DateField", sampleFieldData: null },
    {
      id: 6,
      name: "tag list",
      modelName: "TagListField",
      sampleFieldData: null,
    },
    {
      id: 7,
      name: "multiselect",
      modelName: "MultiSelectField",
      sampleFieldData: {
        country: {
          usa: {
            state: {
              wisconsin: { city: ["madison", "milwaukee"] },
              minnesota: {
                city: {
                  minneapolis: { neighborhood: ["uptown", "downtown"] },
                  mankato: { neighborhood: ["campus", "downtown"] },
                },
              },
            },
          },
          canada: {
            state: {
              alberta: { city: ["fakeville", "faketown"] },
              quebec: { city: ["montreal"] },
            },
          },
        },
      },
    },
    {
      id: 8,
      name: "location",
      modelName: "LocationField",
      sampleFieldData: null,
    },
    {
      id: 9,
      name: "upload",
      modelName: "UploadField",
      sampleFieldData: {
        extractLocation: true,
        extractDate: true,
        enableTiling: true,
        enableDendro: false,
        enableIframe: false,
        enableAnnotation: false,
        forceTiling: false,
        interactiveTranscript: false,
      },
    },
    {
      id: 10,
      name: "related asset",
      modelName: "RelatedAssetField",
      sampleFieldData: {
        nestData: true,
        showLabel: true,
        collapseNestedChildren: false,
        thumbnailView: false,
        defaultTemplate: 0,
        matchAgainst: [0],
        displayInline: false,
        ignoreForDigitalAsset: false,
        ignoreForLocationSearch: false,
        ignoreForDateSearch: false,
      },
    },
  ]);
});

// GET /templates — mirrors Templates::index() JSON path
app.get("/", (c) => {
  const user = c.get("user");

  if (!user) return c.json({ error: "Unauthorized" }, 401);
  if (!user.isInstanceAdmin && !user.isSuperAdmin)
    return c.json({ error: "Forbidden" }, 403);

  const db = c.get("db");

  const response: TemplateSummary[] = (
    db.templates.getAll() as AdminTemplateSeed[]
  ).map((t) => ({
    id: t.templateId,
    name: t.templateName,
    createdAt: t.createdAt,
    modifiedAt: t.modifiedAt,
  }));

  return c.json(response);
});

// GET /templates/getTemplate/:id — mirrors Templates::getTemplate() JSON path
app.get("/getTemplate/:id", (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  if (!user.isInstanceAdmin && !user.isSuperAdmin)
    return c.json({ error: "Forbidden" }, 403);

  const db = c.get("db");
  const id = Number(c.req.param("id"));
  const template = db.templates.get(id) as AdminTemplateSeed | undefined;

  if (!template) return c.json({ error: "Template not found" }, 404);

  return c.json(toAdminTemplateResponse(template));
});

/**
 * Parse a widget array from URLSearchParams-style FormData.
 * Entries like widget[0][label]=Title, widget[0][fieldType]=3, etc.
 * Boolean flags (display, required, etc.) use presence semantics:
 * key present in form data → true; absent → false.
 */
function parseWidgetsFromFormData(formData: FormData) {
  const byIndex: Record<number, Record<string, string>> = {};

  for (const [key, value] of formData.entries()) {
    const match = key.match(/^widget\[(\d+)\]\[(\w+)\]$/);
    if (!match) continue;
    const index = Number(match[1]);
    const field = match[2];
    byIndex[index] ??= {};
    byIndex[index][field] = value as string;
  }

  const boolFlag = (row: Record<string, string>, field: string) => field in row;

  return Object.keys(byIndex)
    .map(Number)
    .sort((a, b) => a - b)
    .map((i) => {
      const row = byIndex[i];
      let fieldData: unknown = null;
      try {
        fieldData = row.fieldData ? JSON.parse(row.fieldData) : null;
      } catch {
        fieldData = null;
      }
      return {
        fieldTitle: row.fieldTitle ?? "",
        label: row.label ?? "",
        tooltip: row.tooltip ?? "",
        fieldTypeId: Number(row.fieldType ?? 1),
        templateOrder: Number(row.templateOrder ?? i + 1),
        viewOrder: Number(row.viewOrder ?? i + 1),
        clickToSearchType: Number(row.clickToSearchType ?? 0),
        fieldData,
        display: boolFlag(row, "display"),
        displayInPreview: boolFlag(row, "displayInPreview"),
        required: boolFlag(row, "required"),
        searchable: boolFlag(row, "searchable"),
        allowMultiple: boolFlag(row, "allowMultiple"),
        attemptAutocomplete: boolFlag(row, "attemptAutocomplete"),
        directSearch: boolFlag(row, "directSearch"),
        clickToSearch: boolFlag(row, "clickToSearch"),
      };
    });
}

// POST /templates/update — create or update (mirrors Templates::update())
// Presence of a numeric templateId in the body → update; absence → create.
app.post("/update", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  if (!user.isInstanceAdmin && !user.isSuperAdmin)
    return c.json({ error: "Forbidden" }, 403);

  const db = c.get("db");
  const formData = await c.req.formData();
  const now = new Date().toISOString();

  const rawTemplateId = formData.get("templateId");
  const isUpdate =
    rawTemplateId !== null && /^\d+$/.test(String(rawTemplateId).trim());
  const templateId = isUpdate ? Number(rawTemplateId) : null;

  const parsedWidgets = parseWidgetsFromFormData(formData);
  const generatedTitles: string[] = [];
  let nextWidgetId = Date.now();

  const widgets = parsedWidgets.map((w) => {
    let fieldTitle = w.fieldTitle.trim();
    if (!fieldTitle) {
      const base = generateFieldTitle(w.label);
      fieldTitle = base;
      let suffix = 2;
      while (generatedTitles.includes(fieldTitle)) {
        fieldTitle = `${base}_${suffix++}`;
      }
    }
    generatedTitles.push(fieldTitle);

    return {
      widgetId: nextWidgetId++,
      fieldTitle,
      type: fieldTypeFromId(w.fieldTypeId),
      label: w.label,
      tooltip: w.tooltip,
      templateOrder: w.templateOrder,
      viewOrder: w.viewOrder,
      display: w.display,
      displayInPreview: w.displayInPreview,
      required: w.required,
      searchable: w.searchable,
      allowMultiple: w.allowMultiple,
      attemptAutocomplete: w.attemptAutocomplete,
      directSearch: w.directSearch,
      clickToSearch: w.clickToSearch,
      clickToSearchType: w.clickToSearchType,
      fieldData: w.fieldData,
    };
  });

  const templateData = {
    templateName: String(formData.get("name") ?? ""),
    showCollection: formData.has("showCollection"),
    showCollectionPosition: Number(formData.get("collectionPosition") ?? 0) as
      | 0
      | 1,
    showTemplate: formData.has("showTemplate"),
    showTemplatePosition: Number(formData.get("templatePosition") ?? 0) as
      | 0
      | 1,
    includeInSearch: formData.has("includeInSearch"),
    indexForSearching: formData.has("indexforSearching"),
    isHidden: formData.has("isHidden"),
    templateColor: Number(formData.get("templateColor") ?? 0),
    recursiveIndexDepth: Number(formData.get("recursiveIndexDepth") ?? 1) as
      | 0
      | 1
      | 2,
    widgetArray: widgets,
  };

  if (isUpdate) {
    const existing = db.templates.get(templateId!) as
      | AdminTemplateSeed
      | undefined;
    if (!existing) return c.json({ error: "Template not found" }, 404);

    const updated = (
      db.templates as ReturnType<typeof createTemplatesTable>
    ).update(templateId!, {
      ...templateData,
      collections: existing.collections ?? {},
      allowedCollections: existing.allowedCollections ?? {},
      createdAt: existing.createdAt,
      modifiedAt: now,
    });

    if (!updated) return c.json({ error: "Template not found" }, 404);

    const summary: TemplateSummary = {
      id: updated.templateId,
      name: updated.templateName,
      createdAt: updated.createdAt,
      modifiedAt: updated.modifiedAt,
    };
    return c.json(summary);
  } else {
    const created = (
      db.templates as ReturnType<typeof createTemplatesTable>
    ).create({
      ...templateData,
      collections: {},
      allowedCollections: {},
      createdAt: now,
      modifiedAt: now,
    });

    const summary: TemplateSummary = {
      id: created.templateId,
      name: created.templateName,
      createdAt: created.createdAt,
      modifiedAt: created.modifiedAt,
    };
    return c.json(summary, 201);
  }
});

// DELETE /templates/delete/:templateId — mirrors Templates::delete() JSON path
app.delete("/delete/:templateId", (c) => {
  const user = c.get("user");

  if (!user) return c.json({ error: "Unauthorized" }, 401);
  if (!user.isInstanceAdmin && !user.isSuperAdmin)
    return c.json({ error: "Forbidden" }, 403);

  const db = c.get("db");
  const templateId = Number(c.req.param("templateId"));
  const template = db.templates.get(templateId);

  if (!template) return c.json({ error: "Template not found" }, 404);

  db.templates.delete(templateId);

  return c.json({ success: true });
});

export default app;
