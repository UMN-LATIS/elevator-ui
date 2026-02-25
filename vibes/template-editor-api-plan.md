---
type: plan
subject: "API layer changes needed before the template editor UI can be built"
feature: template-editor
status: draft
created: 2026-02
updated: 2026-02
related-docs:
  - template-editor-research.md
  - templates-api-analysis.md
---

# Template Editor — API Layer Plan

## Summary

- **Covers:** TypeScript types, fetchers, TanStack Query hooks, and mock server changes needed to support the template editor's CRUD operations. This is the preparatory "make the change easy" PR.
- **Does not cover:** Any UI components or pages (those are the next PR); the backend PHP implementation (`Entity\Template::toArray()`, JSON body parsing for update) — those are backend concerns outside this repo.
- **Key decisions:** A new `AdminTemplate` type is introduced, separate from the existing asset-oriented `Template` type; the write payload uses a dedicated `TemplatePayload` type so the editor has a clear contract; mock routes mirror what we expect the real backend to return.
- **Load when:** Implementing or reviewing the API layer for the template editor.

---

## Context

The existing API layer supports the **asset editor's** template needs (`fetchTemplate` → `/assetManager/getTemplate/:id`). That shape is optimized for asset creation and is missing admin-only fields. The template **editor** needs a different endpoint and different types.

Current gaps (from `template-editor-research.md §6` and `templates-api-analysis.md`):

| Capability | Status |
|---|---|
| `GET /templates` list with `createdAt`/`modifiedAt` | Mock returns them as `undefined`; type already has them as optional |
| `GET /templates/:id` — full admin template | No fetcher, no query hook, no mock route |
| `POST /templates` — create | No fetcher, no mutation, no mock route |
| `PUT /templates/:id` — update | No fetcher, no mutation, no mock route |
| `AdminTemplate` TypeScript type | Does not exist |
| `TemplatePayload` write type | Does not exist |

---

## Task List

Tasks are ordered: types must land before fetchers; fetchers before hooks; mock routes can proceed in parallel with types.

---

### 1. TypeScript Types (`src/types/index.ts`)

#### 1a. Add `createdAt` / `modifiedAt` to `TemplateSummary`

These fields are already optional in the type, but make them explicit and documented. No functional change — the properties exist — but the intent becomes clear.

```ts
export interface TemplateSummary {
  id: number;
  name: string;
  createdAt?: string;   // ISO 8601 — present on all real records; optional only for mock seedability
  modifiedAt?: string;  // ISO 8601
}
```

- [ ] Confirm `TemplateSummary` matches the above (should be a no-op or trivial doc comment addition)

#### 1b. Add `AdminTemplate` interface

A new type, separate from `Template`, representing the full template entity as returned by the admin endpoint. `Template` stays untouched — it's used extensively for asset rendering and has a different shape (`templateId`, `templateName`, `widgetArray` for display).

```ts
/**
 * Full template entity returned by GET /templates/:id.
 * Used in the template editor. Distinct from `Template`,
 * which is the asset-editor-facing shape from /assetManager/getTemplate/:id.
 */
export interface AdminTemplate {
  id: number;
  name: string;
  createdAt?: string;
  modifiedAt?: string;
  showCollection: boolean;
  showCollectionPosition: 0 | 1;
  showTemplate: boolean;
  showTemplatePosition: 0 | 1;
  includeInSearch: boolean;
  indexForSearching: boolean;
  isHidden: boolean;
  recursiveIndexDepth: 0 | 1 | 2;
  widgetArray: WidgetDef[];
}
```

> **Note:** `templateColor` is intentionally omitted — it will not be exposed in the new editor UI.
>
> **Note:** `showCollectionPosition`/`showTemplatePosition` use `0 | 1`, consistent with the existing `TemplateShowPropertyPosition` — consider reusing that type alias.

- [ ] Add `AdminTemplate` interface after `TemplateSummary`

#### 1c. Add `TemplatePayload` write type

The payload sent to create or update a template. Widget items use `Partial<Pick<WidgetDef, 'widgetId'>>` because new widgets don't have an ID yet — the server assigns one on creation.

```ts
/**
 * Payload for POST /templates (create) and PUT /templates/:id (update).
 * Widgets without a widgetId are treated as new by the backend.
 */
export interface TemplatePayload {
  name: string;
  showCollection: boolean;
  showCollectionPosition: 0 | 1;
  showTemplate: boolean;
  showTemplatePosition: 0 | 1;
  includeInSearch: boolean;
  indexForSearching: boolean;
  isHidden: boolean;
  recursiveIndexDepth: 0 | 1 | 2;
  widgetArray: Array<Omit<WidgetDef, 'widgetId'> & { widgetId?: number }>;
}
```

> **Open question:** Should create and update have the same payload shape, or should `UpdateTemplatePayload` extend `TemplatePayload` with a required `id`? The simpler approach is one shared type; the ID is passed as a URL param for updates.

- [ ] Add `TemplatePayload` interface

---

### 2. Mock Server

#### 2a. Add `createdAt` / `modifiedAt` to template seeds (`mock-server/db/templates.ts`)

The seeds currently satisfy the `Template` interface, which has no date fields. Add `createdAt` and `modifiedAt` to each seed as static ISO strings. The mock DB layer stores them; the route layer maps them into responses.

The seed type will need a local extension or cast since `Template` doesn't have these fields. Options:
- Cast seeds as `Template & { createdAt: string; modifiedAt: string }` in the mock DB
- Or add an `AdminTemplateSeed` type in the mock layer only

- [ ] Add `createdAt`/`modifiedAt` to each seed object in `mock-server/db/templates.ts`
- [ ] Update the mock `GET /` route in `mock-server/routes/templates.ts` to include them in the response

#### 2b. Add `GET /:id` route (`mock-server/routes/templates.ts`)

Returns the full `AdminTemplate` shape for a given template ID.

```ts
app.get("/:id", (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  if (!user.isInstanceAdmin && !user.isSuperAdmin)
    return c.json({ error: "Forbidden" }, 403);

  const db = c.get("db");
  const id = Number(c.req.param("id"));
  const template = db.templates.get(id);

  if (!template) return c.json({ error: "Not found" }, 404);

  // Map from seed shape → AdminTemplate response
  const response: AdminTemplate = {
    id: template.templateId,
    name: template.templateName,
    createdAt: template.createdAt,
    modifiedAt: template.modifiedAt,
    showCollection: template.showCollection,
    showCollectionPosition: template.showCollectionPosition,
    showTemplate: template.showTemplate,
    showTemplatePosition: template.showTemplatePosition,
    includeInSearch: template.includeInSearch ?? true,
    indexForSearching: template.indexForSearching ?? true,
    isHidden: template.isHidden ?? false,
    recursiveIndexDepth: template.recursiveIndexDepth ?? 1,
    widgetArray: template.widgetArray,
  };

  return c.json(response);
});
```

> The seed data will need the new admin fields added (`includeInSearch`, etc.) with sensible defaults.

- [ ] Add admin fields to each seed (`includeInSearch`, `indexForSearching`, `isHidden`, `recursiveIndexDepth`)
- [ ] Add `GET /:id` route

#### 2c. Add `POST /` route (create)

Creates a new template. Generates a new `templateId`, sets `createdAt`/`modifiedAt` to `new Date().toISOString()`, assigns `widgetId` to any widget that lacks one.

Returns the created `AdminTemplate`.

- [ ] Add `POST /` route
- [ ] Implement ID generation consistent with other mock entities (check `createBaseTable` for pattern)

#### 2d. Add `PUT /:id` route (update)

Replaces an existing template's fields and widget array. Updates `modifiedAt`. Returns the updated `AdminTemplate`.

- [ ] Add `PUT /:id` route

---

### 3. Fetchers (`src/api/fetchers.ts`)

#### 3a. Add `fetchAdminTemplate(id)`

```ts
export async function fetchAdminTemplate(
  templateId: number
): Promise<AdminTemplate> {
  const res = await axios.get<AdminTemplate>(
    `${BASE_URL}/templates/${templateId}`
  );
  return res.data;
}
```

> Distinct from `fetchTemplate()` which hits `/assetManager/getTemplate/:id` and returns the asset-editor shape. Both will coexist.

- [ ] Add `fetchAdminTemplate`

#### 3b. Add `createTemplate(payload)`

```ts
export async function createTemplate(
  payload: TemplatePayload
): Promise<AdminTemplate> {
  const res = await axios.post<AdminTemplate>(
    `${BASE_URL}/templates`,
    payload
  );
  return res.data;
}
```

> **Note:** The real backend currently only accepts form-encoded POST (`$this->input->post()`). Once the backend is updated to parse JSON bodies, this fetcher will work as-is. The mock accepts JSON immediately.

- [ ] Add `createTemplate`

#### 3c. Add `updateTemplate(id, payload)`

```ts
export async function updateTemplate(
  templateId: number,
  payload: TemplatePayload
): Promise<AdminTemplate> {
  const res = await axios.put<AdminTemplate>(
    `${BASE_URL}/templates/${templateId}`,
    payload
  );
  return res.data;
}
```

- [ ] Add `updateTemplate`

---

### 4. Query Hooks (`src/queries/useTemplateQuery.ts`)

#### 4a. Add `useAdminTemplateQuery(id)`

```ts
export function useAdminTemplateQuery(
  templateId: MaybeRefOrGetter<number | null>,
  options = {}
) {
  return useQuery<AdminTemplate | null>({
    queryKey: [TEMPLATES_QUERY_KEY, "admin", templateId],
    enabled: () => !!toValue(templateId),
    initialData: () => null,
    queryFn: async () => {
      const id = toValue(templateId);
      return id ? await fetchers.fetchAdminTemplate(id) : null;
    },
    refetchOnWindowFocus: false,
    ...options,
  });
}
```

> Uses a different query key (`["templates", "admin", id]`) from `useTemplateQuery` (`["templates", id]`) to avoid cache collisions between the two shapes.

- [ ] Add `useAdminTemplateQuery`

#### 4b. Add `useCreateTemplateMutation()`

```ts
export function useCreateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TemplatePayload) => fetchers.createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [INSTANCE_QUERY_KEY] });
      const instanceStore = useInstanceStore();
      instanceStore.refresh();
    },
  });
}
```

- [ ] Add `useCreateTemplateMutation`

#### 4c. Add `useUpdateTemplateMutation()`

```ts
export function useUpdateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TemplatePayload }) =>
      fetchers.updateTemplate(id, payload),
    onSuccess: (_data, { id }) => {
      // Invalidate both the admin cache and the asset-editor cache for this template
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [INSTANCE_QUERY_KEY] });
      const instanceStore = useInstanceStore();
      instanceStore.refresh();
    },
  });
}
```

- [ ] Add `useUpdateTemplateMutation`

---

## Open Questions

1. **Backend timeline for `Entity\Template::toArray()` and JSON body parsing** — The mock can be built now to match the expected shape, but the real fetchers won't work end-to-end until the PHP backend implements these. Is there a backend PR in flight we should coordinate with?

2. **`TemplatePayload.widgetArray` for new vs. existing widgets** — The current plan uses `widgetId?: number` to distinguish new widgets from existing ones. Confirm this matches what the backend will expect.

3. **`showCollectionPosition` / `showTemplatePosition` in `AdminTemplate`** — These use `0 | 1`. Should they reuse the existing `TemplateShowPropertyPosition` type alias from `src/types/index.ts`?

4. **`AdminTemplate` in the same file as `Template`?** — `src/types/index.ts` is already large. Worth splitting template-related types into `src/types/templates.ts` as part of this PR? Or defer to keep the PR minimal.
