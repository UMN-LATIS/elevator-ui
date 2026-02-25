---
type: analysis
subject: "Backend template API — auth model, JSON detection, response shapes, unimplemented methods"
feature: template-editor
status: active
created: 2026-02
updated: 2026-02
related-docs:
  - template-editor-research.md
related-prs: [444]
---

# Templates API Analysis

## Summary

- **Covers:** Auth/access model for template endpoints; how the backend detects JSON vs HTML requests; exact response shapes for `GET /templates` and `GET /templates/edit/:id`; status of `Template::toArray()` (called but unimplemented)
- **Does not cover:** Widget-level API; create/update endpoints (those gaps are catalogued in `template-editor-research.md` §6)
- **Key decisions:** Frontend must send `Accept: application/json` header; `Template::toArray()` must be implemented before the edit endpoint returns usable data
- **Load when:** Writing or reviewing frontend fetchers, mock server handlers, or TypeScript types for templates

Branch reviewed: `feature/admin-template-index-page` (PHP backend) + current branch (frontend)

---

## Backend: `GET /defaultinstance/templates` (index)

**Controller**: `Templates::index()` in `application/controllers/Templates.php`

### Auth / Access
- Requires authenticated user (`isCurrentUserAuthed()` → `user_model->userLoaded`)
- Requires instance-admin-level access (`isCurrentUserAdmin()` → `getAccessLevel('instance', ...) >= PERM_ADMIN`)
- Auth failures return `401` / `403` JSON if request has `Accept: application/json`, otherwise redirect

### JSON detection
`isJsonRequest()` checks `Accept` header for `application/json`. The frontend must send this header to get JSON back (otherwise it gets the legacy PHP-rendered HTML view).

### Response shape

```json
[
  {
    "id": 1,
    "name": "Some Fields",
    "createdAt": "2024-01-15T10:00:00+00:00",
    "modifiedAt": "2024-03-20T14:30:00+00:00"
  },
  ...
]
```

This is produced by `toTemplateSummary()` — a private helper on the controller — applied via `array_map` over `$instance->getTemplates()->toArray()`.

**Key contract**:
- Returns only templates belonging to the **current instance** (not all templates globally)
- `createdAt` / `modifiedAt` are ISO 8601 strings via `->format('c')`, or `null` if not set
- No widget data, no collections — this is a summary/listing only

---

## Backend: `GET /defaultinstance/templates/edit/:id`

**Controller**: `Templates::edit($id)`

### Response shape

Calls `$template->toArray()` on the Doctrine `Entity\Template` entity.

**⚠️ CRITICAL GAP**: `Entity\Template::toArray()` **does not exist** on the current backend branch. This method is called but never defined on the entity class. The edit and update JSON paths will throw a fatal error. This likely means the method is yet to be implemented.

The shape is not yet defined, but based on the entity fields and the existing `AssetManager::getTemplate()` pattern (which uses `Asset_template::getAsArray()`), an expected full template JSON would look like:

```json
{
  "id": 1,
  "name": "Some Fields",
  "createdAt": "2024-01-15T10:00:00+00:00",
  "modifiedAt": "2024-03-20T14:30:00+00:00",
  "showCollection": false,
  "showTemplate": false,
  "collectionPosition": 1,
  "templatePosition": 1,
  "includeInSearch": true,
  "indexForSearching": true,
  "isHidden": false,
  "templateColor": 0,
  "recursiveIndexDepth": 1,
  "widgetArray": [ ... ]
}
```

But this is speculative — the shape entirely depends on what `toArray()` ends up doing.

---

## Backend: `POST /defaultinstance/templates/update`

**Controller**: `Templates::update()`

- Creates or updates a template and its widgets
- Continues using `$this->input->post(...)` (form-encoded POST body) — **not JSON body parsing**
- On JSON request: returns `$template->toArray()` (same undefined method as above)
- On non-JSON: redirects to `templates/`

Widget fields processed: `display`, `required`, `allowMultiple`, `fieldTitle`, `label`, `tooltip`, `fieldData` (JSON-decoded), `templateOrder`, `viewOrder`, `displayInPreview`, `searchable`, `attemptAutocomplete`, `fieldType` (int FK), `directSearch`, `clickToSearch`, `clickToSearchType`

---

## Frontend: `fetchAllTemplates()` → `GET /defaultinstance/templates`

```ts
// src/api/fetchers.ts
export async function fetchAllTemplates() {
  const res = await axios.get(`${BASE_URL}/templates`);
  return res.data;
}
```

**Issues to note**:
1. No `Accept: application/json` header set explicitly — relies on Axios defaults. Axios does set `Accept: application/json, text/plain, */*` by default, so `isJsonRequest()` will match on the `application/json` part. ✅ This should work.
2. No return type annotation — `res.data` is untyped. The `useAllTemplatesQuery` passes it through with no cast, so `templates` in `AllTemplatesPage` is `unknown`. The `TemplateSummary` type exists in `src/types/index.ts` and matches the backend response shape exactly.

---

## Frontend: `TemplateSummary` type

```ts
// src/types/index.ts
export interface TemplateSummary {
  id: number;
  name: string;
  createdAt?: string;
  modifiedAt?: string;
}
```

**Matches backend** `toTemplateSummary()` output exactly. ✅

---

## Frontend: `useAllTemplatesQuery`

```ts
export function useAllTemplatesQuery(options = {}) {
  return useQuery({
    queryKey: [TEMPLATES_QUERY_KEY],
    queryFn: () => fetchers.fetchAllTemplates(),
    refetchOnWindowFocus: false,
    ...options,
  });
}
```

- Query key: `["templates"]` (no params — fetches all for current instance)
- No `enabled` guard — fires immediately on mount
- No type parameter passed to `useQuery`, so data is `unknown`

---

## Mock Server: Current State

The mock server (`mock-server/`) currently has **no `/defaultinstance/templates` route** for the index endpoint.

`server.ts` does not register any route at `app.route("/defaultinstance/templates", ...)`.

The existing templates support is only:
- `GET /defaultinstance/assetManager/getTemplate/:templateId` — single template with full widget array + collections (used for asset create/edit)
- `GET /defaultinstance/assetManager/compareTemplates/:id1/:id2` — template field diff

The `db.templates` table is fully populated with seeds (templates 999, 1, 2, 3, 4, 5) and has a `compare()` method, but no `getAll()` listing endpoint is wired up in the HTTP layer.

---

## What the Mock Server Needs

### For the index page (`AllTemplatesPage`)

A new route file `mock-server/routes/templates.ts` registered at `/defaultinstance/templates`, handling:

**`GET /`** — returns `TemplateSummary[]`
- Auth check: user must exist and be admin (`isInstanceAdmin || isSuperAdmin`)
- Maps `db.templates.getAll()` to `{ id, name, createdAt, modifiedAt }`
- The seed `Template` objects need `createdAt`/`modifiedAt` fields added (currently not present in seeds)

### For edit pages (future)

**`GET /:id`** — returns full template with widget array
**`POST /update`** or **`PUT /:id`** — update a template

The exact shape of the edit response is blocked on `Entity\Template::toArray()` being defined in the backend. Once that's defined, the mock should mirror it.

---

## Seed Data Gap

Current `templateSeeds` in `mock-server/db/templates.ts` use the `Template` interface from `src/types/`, which does **not** include `createdAt` or `modifiedAt`. These fields exist on the backend Doctrine entity but are not in the frontend `Template` type.

The `TemplateSummary` type has `createdAt?: string` and `modifiedAt?: string` (optional), so the mock can safely return them even though they're not in the base `Template` type. Two options:
1. Store them only in the mock DB layer (not in the TS `Template` type)
2. Extend the `Template` type to include `createdAt`/`modifiedAt` (a proper improvement)

---

## Summary of Gaps / Action Items

| Item | Status |
|------|--------|
| `GET /defaultinstance/templates` mock route | ❌ Missing |
| `TemplateSummary` type matches backend | ✅ Already correct |
| `fetchAllTemplates()` untyped return | ⚠️ No `Promise<TemplateSummary[]>` annotation |
| `useAllTemplatesQuery` untyped `data` | ⚠️ No generic `<TemplateSummary[]>` on `useQuery` |
| Seed templates missing `createdAt`/`modifiedAt` | ⚠️ Needed for realistic mock data |
| `Entity\Template::toArray()` on backend | ❌ Not yet implemented (edit/update JSON paths broken) |
| Mock `GET /templates/:id` (edit) route | ❌ Missing (blocked on `toArray()` shape) |
| `Accept: application/json` header in `fetchAllTemplates` | ✅ Axios sets it by default |
