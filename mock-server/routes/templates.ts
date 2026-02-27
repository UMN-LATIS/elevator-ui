import { Hono } from "hono";
import type { MockServerContext } from "../types";
import type {
  TemplateSummary,
  AdminTemplate,
  AdminWidgetDef,
  TemplatePayload,
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

// POST /templates — create a new template
app.post("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  if (!user.isInstanceAdmin && !user.isSuperAdmin)
    return c.json({ error: "Forbidden" }, 403);

  const db = c.get("db");
  const payload = await c.req.json<TemplatePayload>();
  const now = new Date().toISOString();

  // Track generated fieldTitles within this request to avoid collisions.
  const generatedTitles: string[] = [];

  let nextWidgetId = Date.now();
  const widgets = payload.widgetArray.map((w) => {
    let fieldTitle = w.fieldTitle?.trim() ?? "";
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
      widgetId: w.widgetId ?? nextWidgetId++,
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

  const created = (
    db.templates as ReturnType<typeof createTemplatesTable>
  ).create({
    templateName: payload.name,
    showCollection: payload.showCollection,
    showCollectionPosition: payload.showCollectionPosition,
    showTemplate: payload.showTemplate,
    showTemplatePosition: payload.showTemplatePosition,
    includeInSearch: payload.includeInSearch,
    indexForSearching: payload.indexForSearching,
    isHidden: payload.isHidden,
    templateColor: payload.templateColor,
    recursiveIndexDepth: payload.recursiveIndexDepth,
    widgetArray: widgets,
    collections: {},
    allowedCollections: {},
    createdAt: now,
    modifiedAt: now,
  });

  return c.json(toAdminTemplateResponse(created), 201);
});

// PUT /templates/:id — update an existing template
app.put("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  if (!user.isInstanceAdmin && !user.isSuperAdmin)
    return c.json({ error: "Forbidden" }, 403);

  const db = c.get("db");
  const id = Number(c.req.param("id"));
  const existing = db.templates.get(id) as AdminTemplateSeed | undefined;

  if (!existing) return c.json({ error: "Template not found" }, 404);

  const payload = await c.req.json<TemplatePayload>();
  const now = new Date().toISOString();

  let nextWidgetId = Date.now();
  const widgets = payload.widgetArray.map((w) => ({
    widgetId: w.widgetId ?? nextWidgetId++,
    fieldTitle: w.fieldTitle?.trim() || generateFieldTitle(w.label),
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
  }));

  const updated = (
    db.templates as ReturnType<typeof createTemplatesTable>
  ).update(id, {
    templateName: payload.name,
    showCollection: payload.showCollection,
    showCollectionPosition: payload.showCollectionPosition,
    showTemplate: payload.showTemplate,
    showTemplatePosition: payload.showTemplatePosition,
    includeInSearch: payload.includeInSearch,
    indexForSearching: payload.indexForSearching,
    isHidden: payload.isHidden,
    templateColor: payload.templateColor,
    recursiveIndexDepth: payload.recursiveIndexDepth,
    widgetArray: widgets,
    // Preserve fields needed by the asset-editor GET route
    collections: existing.collections ?? {},
    allowedCollections: existing.allowedCollections ?? {},
    createdAt: existing.createdAt,
    modifiedAt: now,
  });

  if (!updated) return c.json({ error: "Template not found" }, 404);

  return c.json(toAdminTemplateResponse(updated));
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
