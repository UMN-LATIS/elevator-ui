---
type: research
subject: "Template/widget schema, legacy editor analysis, API gaps, CMS UX survey, frontend component inventory"
feature: template-editor
status: active
created: 2026-02
updated: 2026-02
related-docs:
  - templates-api-analysis.md
related-prs: [444]
---

# Template Editor Research Findings

## Summary

- **Covers:** What templates and widgets are; the 10 widget types and their `fieldData` schemas; how the legacy PHP/Handlebars editor works; four missing/broken API endpoints; CMS UX patterns from Contentful, Directus, and Supabase; inventory of reusable frontend components (FormPageLayout, DragDropList, TanStack query hooks)
- **Does not cover:** UI mockups, final component file structure, backend migration strategy, or the implementation plan
- **Key decisions:** `fieldTitle` is auto-derived and must be locked after creation; `FormSubSection` must be extracted before reuse; dual-ordering (templateOrder / viewOrder) UX is still open — five options documented in §10e
- **Load when:** Planning or implementing any part of the template editor feature

## TLDR

A **template** defines the metadata schema for a class of digital assets — it's a list of typed **widgets** (fields). The legacy editor is a Bootstrap 3 / Handlebars.js form where widget-specific configuration ("fieldData") is edited as a raw JSON textarea — confusing and error-prone. The new UI should replace that JSON blob with per-type form UIs. The patterns from `CreateOrEditAssetPage` (FormPageLayout, TanStack Query, composable state via `provide/inject`) provide the right model to follow. Several API gaps must be addressed before implementation.

---

## 1. What Is a Template?

A **Template** is a schema that defines what fields (widgets) an asset has. It belongs to an instance and can be used by many assets. Key metadata:

| Field | Type | Description |
|---|---|---|
| `name` | string | Display name |
| `includeInSearch` | bool | Include assets in public search results. Assets are still indexed but this flag is checked at query time and excludes them from public searches when false. (Form label: "Include In Public Search Results") |
| `indexForSearching` | bool | Send assets of this template to the search index at all. If false, assets are never indexed and invisible to search everywhere. (Form label: "Index For Searching") |
| `isHidden` | bool | Hide from "Add new asset" menu |
| `showCollection` | bool | Show collection name on asset view page |
| `showTemplate` | bool | Show template name on asset view page |
| `collectionPosition` | 0\|1 | Bottom or top |
| `templatePosition` | 0\|1 | Bottom or top |
| `templateColor` | 0–8 | Decorative color token for UI |
| `recursiveIndexDepth` | 0–2 | How many levels deep of related assets' text content to pull into *this* asset's search index entry. 0 = only this asset's own fields; 1 = also include direct related assets' text; 2 = also include their related assets' text. |

The template also contains an ordered array of **widgets** (`widgetArray`).

> **Note:** `includeInSearch`, `indexForSearching`, `isHidden`, `templateColor`, and `recursiveIndexDepth` are **not present** in the current frontend `Template` TypeScript interface[^1] nor returned by `fetchTemplate()`[^2] (which hits `/assetManager/getTemplate/:id`, not `/templates/edit/:id`). Adding them requires both a backend API change and a type update.

---

## 2. What Is a Widget?

A **Widget** is a single typed field definition within a template. There are **10 widget types**[^3]:

| Type | Model class | Notes |
|---|---|---|
| `text` | `Text` | Single-line text |
| `text area` | `Textarea` | Multi-line text |
| `select` | `Select` | Dropdown, optionally multi-select |
| `checkbox` | `Checkbox` | Boolean on/off |
| `date` | `Date` | Date range with text+numeric |
| `tag list` | `Tags` | Free-form tags |
| `multiselect` | `Multiselect` | Cascading hierarchical selects |
| `location` | `Location` | Map pin + address |
| `upload` | `Upload` | File attachment |
| `related asset` | `Related_asset` | Link to another asset |

[JJ: note that related assets can contain other related assets.]

### 2a. Common Widget Properties

Every widget has[^4][^5]:

> **Note on `display` vs `displayInPreview`**: `display` controls whether the field appears on the full asset detail page. `displayInPreview` controls whether it appears in search result cards / list view previews. A field can be searchable/indexed without being displayed on either.


| Property | Description |
|---|---|
| `fieldTitle` | Internal key (e.g. `title_3`). Used as the key in asset data. **Derived from label + instanceId; locked after creation.** [JJ: this is currently done client side, but I wonder if this is better as a server side thing to avoid accidentally clobbering such an important field]|
| `label` | Human-readable field name |
| `tooltip` | Helper text shown in the asset editor |
| `templateOrder` | Position in the edit form |
| `viewOrder` | Position on the asset display page |
| `display` | Show on asset view page |
| `displayInPreview` | Show in search result cards |
| `required` | Validation: field must have a value |
| `searchable` | Include in full-text search |
| `allowMultiple` | Allow more than one value entry |
| `attemptAutocomplete` | Suggest values from existing data |
| `directSearch` | Exposes this field in the **advanced search modal** as a dedicated filter input *and* in the **sort options** dropdown. The field title and label are passed to both the advanced search form and the sort structure builder.[^note-directsearch] |
| `clickToSearch` | Clicking the value triggers a search |
| `clickToSearchType` | `0` = global search, `1` = field-specific search |

[JJ: one issue is balance the number of options show in the UI with complexity. We should probably reduce the number]

### 2b. fieldTitle Auto-Generation

The `fieldTitle` is auto-derived from the label in the legacy editor[^6]:

```
fieldTitle = sanitize(label) + "_" + instanceId
// "My Field" + instanceId 3 → "MyField_3"
```

- Sanitization: strip non-alphanumeric, lowercase
- Uses instance ID (not template ID) so the same label across templates gets the same `fieldTitle`, enabling cross-template autocomplete
- **Locked once created** — changing a field title after assets exist would orphan their data


[JJ: again, this is probably best done server side right?]

---

## 3. Widget fieldData — Per-Type Configuration

`fieldData` is a JSON column on the widget. Most types don't use it; complex types use it heavily.

[JJ: perhaps a first iteration is using JSON. Most fields have default JSON when a new widget is created.]

### Simple types (no meaningful fieldData)
`text`, `text area`, `checkbox`, `date`, `tag list`, `location` — `fieldData` is `null` or `[]`.

### `select`[^7]
```json
{
  "multiSelect": false,
  "selectGroup": ["Option A", "Option B", "Option C"]
}
```
- `multiSelect: true` renders a multi-select listbox
- `selectGroup` can also be a key-value object: `{ "key": "Display Label" }`
- **New UI**: a dynamic list editor (add/remove/reorder options). A "multi-select?" toggle.

### `multiselect`[^8]
A cascading dropdown widget: each level's options depend on the previous selection. Structure is a nested object:

```json
{
  "Type": {
    "Mammal": ["Dog", "Cat", "Horse"],
    "Bird": ["Eagle", "Parrot"]
  }
}
```

The top-level keys become the first cascade column labels; the nested keys become options; if a value is an array, those are the leaf options for the final column.

- **Rendering**: `getTopLevels()` extracts each column label. Selecting from column N filters column N+1.
- **New UI**: This is the most complex widget config. Needs a tree builder UI — add/remove levels, add/remove options per node. Consider a nested accordion or visual tree.

### `upload`[^9]
A set of boolean feature flags:

| Flag | Meaning |
|---|---|
| `extractDate` | Auto-extract date from EXIF metadata |
| `extractLocation` | Auto-extract GPS from EXIF metadata |
| `enableTiling` | Enable deep-zoom tiling (e.g. large images) |
| `enableIframe` | Embed via iframe |
| `interactiveTranscript` | Display interactive transcript |
| `ignoreForDigitalAsset` | Exclude from "digital object" logic |
| `forceTiling` | Force tiling even if not recommended |
| `enableDendro` | Enable dendrochronology viewer |
| `enableAnnotation` | Enable annotation layer |

- **New UI**: A group of labeled toggles — very straightforward.

### `related asset`[^10]
Links to another asset. Configuration controls how the relationship is rendered and constrained:

| Option | Type | Meaning |
|---|---|---|
| `defaultTemplate` | `number` | Pre-filter the asset picker (in the edit form) to show only assets of this template |
| `matchAgainst` | `number[]` | Template IDs searched when the user types in the related asset picker |
| `nestData` | `bool` | **View page**: expand the related asset's fields inline (accordion). When `false`, only a clickable link is shown. |
| `displayInline` | `bool` | **Edit form**: render the related asset's own field inputs directly inside the parent asset's edit form (inline editing). When `false`, you pick an existing asset by searching. |
| `collapseNestedChildren` | `bool` | **View page**: show nested children in a compact collapsed summary (thumbnail + label + sidebar) instead of the full accordion expansion. Requires `nestData: true`. |
| `thumbnailView` | `bool` | **View page**: render related assets as a thumbnail grid instead of a list. Takes precedence over `nestData`. |
| `showLabel` | `bool` | **View page**: append the curator-entered relationship label (in parentheses) after the related asset's title |
| `ignoreForDigitalAsset` | `bool` | Exclude this relation when determining whether the asset has a primary digital file |
| `ignoreForLocationSearch` | `bool` | Don't propagate related asset location coordinates into this asset's map search |
| `ignoreForDateSearch` | `bool` | Don't propagate related asset date values into this asset's date range search |

- **New UI**: Toggle group for booleans + template picker(s) for `defaultTemplate` and `matchAgainst`.

---

## 4. Legacy Template Editor

**URL**: `/defaultinstance/templates/edit/:id`
**Controller**: `Templates::edit()` + `Templates::update()`[^11]
**Frontend**: Bootstrap 3 HTML form + Handlebars.js widget templates + jQuery

### Flow

1. Page loads with the template name form and an "Advanced Settings" collapsible panel
2. Existing widgets are injected via a PHP loop into JavaScript that renders Handlebars templates into a `#widgetList` div[^12]
3. "Add a new widget" appends a new Handlebars-rendered row with a timestamp-based ID
4. Each widget row contains:
   - Left column: label, internal title (auto-derived, lockable), field type dropdown, tooltip, **fieldData textarea** (raw JSON)
   - Right column: checkboxes for display, required, searchable, attemptAutocomplete, displayInPreview, allowMultiple, directSearch, clickToSearch
5. When field type changes, if the fieldData textarea is empty, the legacy app auto-fills it with the `sample_field_data` from the `field_types` DB table[^13]
6. fieldData is validated as JSON on blur — invalid JSON turns the textarea red
7. Submit posts the entire form to `Templates::update()` via HTML form POST (not JSON API)

### Limitations of the Legacy Editor

- **JSON textarea for fieldData** — users must write raw JSON; documented nowhere in the UI. Error-prone for complex types (especially multiselect).
- No drag-to-reorder (ordering uses separate hidden numeric inputs; there's a separate `/templates/sort/:id` page for reordering).
- No live preview of how the widget will look. [JJ: this is a good idea, but low priority. It's challenging. Not critical for this first iteration.]
- No undo. [JJ: undo would be great. I wonder how much complexity it would introduce? Do we get some naturally from the browser? It hasn't come up in discussion, so it's low priority.]
- Entire template is deleted and recreated on save (`deleteQuery` nukes all widgets, then re-inserts)[^14].


[JJ: Sort order happens on a different page because there are TWO different sort orders. One for EDIT asset, and one for VIEW asset. One idea was to put the sort order in the sidebar, and permit users to move widgets by name. This would be easier than moving these giant widget elements around in the main form. Another idea would be to have a EDIT and VIEW ordering for the widget and the user can switche between each and shuffle them around. I find the separate page counter-intuitive (I didn't know it existed until my boss told me), but it's a pattern that currently exists and moving away from it might add more complexity or confusion. We should consider keeping things as-is or other alternatives. In our planning phase, I would like to hear multiple approaches.]

---

## 5. New UI Patterns to Follow

### Component Architecture
The asset editor is the best reference for a comparably complex form:

- **`CreateOrEditAssetPage`**: outer page shell, handles init state (template selection), loads data[^15]
- **`EditAssetForm`**: the form itself, maps over widgets, delegates to `EditWidget` per type[^16]
- **`EditWidgetLayout`**: shared accordion wrapper: label, tooltip, expand/collapse, validation state[^17]
- **`EditWidget.vue`**: dispatcher component — routes to the correct widget component by type[^18]

The template editor needs an analogous structure:
- **`CreateOrEditTemplatePage`**: outer shell, handles create vs. edit, loads data via TanStack Query
- **`EditTemplateForm`**: the form, template-level settings + widget list
- **`EditTemplateWidget`** (or similar): per-widget config section — common settings + type-specific panel

### Form Components
`InstanceSettingsPage` is the best reference for admin settings screens[^19]:

- `FormPageLayout` + `FormSection` + `FormSubSection` for layout
- `InputGroup`, `SelectGroup`, `ToggleGroup`, `TextAreaGroup` for form fields
- `FormSubSection` with `:isOpen` to conditionally show dependent fields

### State Management
- `createAssetEditor` composable pattern: reactive state in a composable, `provided` via Vue's `provide/inject` so deep children can access it without prop drilling[^20]
- TanStack Query for fetching the template (`useTemplateQuery`) and all templates list (for related-asset template pickers)
- Mutations for save and create

### Drag-to-Reorder
The asset editor doesn't have drag-to-reorder (assets have fixed widget order from template). The template editor needs it. The codebase has a `DragDropList` component[^21] that should be evaluated for this purpose.

[JJ: This may not be right. See comment above about sorting.]

---

## 6. API Gaps

### What exists
| Endpoint | Use |
|---|---|
| `GET /templates` | List all templates (summary only: id + name) |
| `GET /assetManager/getTemplate/:id` | Fetch full template with widgetArray |
| `DELETE /templates/delete/:id` | Delete a template |
| `POST /templates/update` | Create or update (form POST only, not JSON) |

### What's missing / broken
1. **Create/update endpoint that accepts JSON** — `Templates::update()` uses `$this->input->post()` (CodeIgniter form POST parsing). The new UI will need a JSON API to create/update templates.
2. **`Template::toArray()` is unimplemented** — the backend branch called out in `templates-api-analysis.md` has `$template->toArray()` wired into the JSON response path of `/templates/edit/:id` and `/templates/update`, but that method doesn't exist on the `Entity\Template` class[^22].
3. **Missing fields in frontend `Template` type** — `includeInSearch`, `indexForSearching`, `isHidden`, `templateColor`, `recursiveIndexDepth` exist in the backend entity but are absent from both the TypeScript interface[^1] and the fetch path. [JJ: templateColor is not going to be used in the new UI.]
4. **`TemplateSummary` missing dates** — the mock server types don't include `createdAt` / `modifiedAt` even though the backend includes them.

---

## 7. Key Complexities Ahead

### Multiselect Builder
The multiselect `fieldData` is a deeply nested JSON tree. Building a GUI for this from scratch is the hardest widget config problem. Options to consider:

- A recursive tree component (nodes can have children or leaf lists)
- An "add level" / "add option" button pattern
- Import/export as JSON (escape hatch for power users)

[JJ: Yes, this is probably the most complex element. A good argument for a JSON-first approach, and then iterate each widget's interface. By the time we get to Multiselect, we can decide if it's worth the code.]

### fieldTitle Locking
New widgets get auto-derived `fieldTitle` from label. Existing widgets must display it read-only (changing it after assets exist breaks their data). The editor needs to distinguish "new" vs "existing" widgets and lock the field accordingly.

### Template Order vs. View Order
Widgets have **two separate orderings**:
- `templateOrder`: order in the edit form (for curators entering data)
- `viewOrder`: order on the public asset display page

The legacy editor handles these as hidden inputs; the sort page handles reordering visually. The new UI could collapse these into one ordering or expose two separate drag lists.

### Widget "Delete" Safety
Deleting a widget from a template doesn't delete existing asset data using that field — it just orphans it. The UI should warn users before deleting a widget, ideally showing how many assets have data in that field.

---

## 8. Suggested Widget Config UIs

| Widget type | fieldData UI approach |
|---|---|
| text, text area, checkbox, date, tag list, location | No fieldData config needed — show only common settings |
| `select` | Editable list of options (add/remove/reorder). A single "Allow multiple selection" toggle. Option to enter a display label separate from the stored value (key-value mode). |
| `multiselect` | Tree builder: add named levels, add options per level, with nested sub-options. Escape hatch: raw JSON editor view. |
| `upload` | Labeled toggle group for all boolean flags. |
| `related asset` | Boolean toggles + a template picker (searchable dropdown) for `defaultTemplate`. Multi-select template picker for `matchAgainst`. |


[JJ: A few other notes: 1) There are multiple themes (e.g. see dark.css) used in the new UI based on Material Design 3 color variables. We use tailwind and have already setup tailwind config. ALWAYS prefer direct tailwind classes rather than custom CSS. ALWAYS use MD3 color variables rather than hard coded colors to ensure we're not breaking visuals in other themes. 2) In terms of order of operations we'll want to make backend changes first so that the right api is available to the frontend. Then, with the new front-end adding/updating Tanstack queries for getting and saving template data. Then, we can do a basic form that's roughly equivalent to the existing form. Finally, we can work on improving the overall UX and individual widgets. This may need a design phase for each, so we'll handle this last. 3) I'd like to explore UX patterns used by other content management systems: supabase, ghost, wordpress, google sites. We should research which other sites/projects may have notable design/UX inspiration we should review before making design decisions.]

> **See Section 9 for CMS UX research findings and Section 10 for additional codebase inventory that feeds into planning.**





---

## 9. CMS UX Patterns Research

The following systems were reviewed for field/schema editor UX inspiration. All are more mature than Elevator's legacy editor and share several patterns worth adopting.

### 9a. Common Patterns Across CMSes

**Two-step "add field" flow** — Every tool separates type selection from configuration. The user first picks a field type (often from an icon grid or dropdown); only then do the type-specific configuration options appear. This eliminates the "blank JSON textarea" problem entirely.

**Type and key are immutable after creation** — Supabase, Directus, and Contentful all explicitly lock the internal field key (and usually the type) once the field has been saved. They either hide the field or render it as plain read-only text. This directly validates the `fieldTitle` lock design in Elevator.

**Display name vs. internal key** — Every tool distinguishes the human-readable label from the stored key. Directus parses the key through a "title formatter" to improve readability without making it editable.

**Common settings always visible; type-specific settings in a separate section** — Required, label, help text, and visibility flags are always shown. Type-specific config is either collapsed below or shown in a dedicated tab only when applicable.

**Explicit validation section** — Directus and Contentful have a separate "Validation" configuration section rather than mixing validation rules with display flags. Worth considering for Elevator's `required` / `searchable` grouping.

---

### 9b. Contentful

Contentful's content model editor is the closest analogue to Elevator's template editor.[^26]

**Field type picker** — A grid of named icons representing each field type. Selecting one opens a sidebar/modal pre-configured for that type. The "Add field" button is always pinned at the bottom of the field list — it opens this picker.

![Contentful "Add new field" button in the content type editor — clicking it reveals the field type grid](https://images.ctfassets.net/tz3n7fnw4ujc/2Oy5ezqjYElZaZrMMRDcvo/ed2fff4af66bda0794f994410208beab/add-new-field.png)

**Field name → ID derivation** — The user enters a display name; the "Field ID" is auto-derived (slugified). The field ID is shown in read-only text adjacent to the name, and is locked as soon as the field is saved. This directly validates Elevator's `fieldTitle` immutability design.

**Tabbed field configuration** — Three tabs: *Settings* (label, help text, required), *Validations* (min/max, pattern, allowed values, required format), and *Appearance* (which widget to render the field with — dropdown, checkbox set, etc.). The Appearance tab is roughly equivalent to Elevator's `fieldData` combined with the display flags.[^27]

![Contentful Appearance tab — lets editors choose how a text field is rendered (single line, dropdown, checkbox, etc.)](https://images.ctfassets.net/aeu1amk9b600/6YfMx9EMxH4UbC4VD4GV6K/9fc3b17730636ef17bbfe298c1d98f89/image.png?w=1320&q=60&fm=webp)

![Contentful Validations tab — min/max length, pattern matching, allowed values list](https://images.ctfassets.net/aeu1amk9b600/57NfoOqK74Q6nqKXZP7Z9g/daf8fb223eef33b333e95e29dcb0f9d6/image.png?w=1320&q=60&fm=webp)

**JSON preview** of the full content model is available as an escape hatch for power users — analogous to the raw JSON fallback JJ proposed for multiselect.

---

### 9c. Directus

Directus has the most comprehensive field configuration UI, organized into labeled sections inside a sliding panel (not a modal).[^28]

**Interface picker first** — When creating a field, you first choose an *interface* (the input type — text, date, map, relation, etc.). Only after selecting the interface does the full configuration panel open. This is the "type-first" flow.

![Directus field creation — selecting an interface (input type) before any configuration](https://directus.io/docs/img/426fb648-1e88-46e4-92f1-af76f3254d25.webp)

Once the interface is chosen, a six-tab configuration panel slides in:

| Tab/Section | What It Contains |
|---|---|
| Schema | DB column key (immutable after save), type (immutable), nullable, unique, indexed, default value |
| Field | Display name, note (tooltip), read-only flag, required flag, name translations |
| Interface | The input component + per-interface config options |
| Display | How the value is shown in list views; conditional styles (color/icon based on value) |
| Validation | Custom validation rules + custom error messages |
| Conditions | Conditionally set `hidden`/`required`/`read-only` based on other field values |

![Directus six-tab field configuration panel — Schema, Field, Interface, Display, Validation, Conditions](https://directus.io/docs/img/1234cdf2-778e-4e3a-836c-bb698398848b.webp)

**Field width** is configurable per field: `half` (two columns side by side) or `full` (single wide). This is a simple UX improvement worth considering for Elevator's dense widget list.

**Key/type immutability** is called out explicitly in the UI with a warning banner: *"The field key and type cannot be modified after collection creation."*

---

### 9d. Supabase Table Editor

Supabase's column editor is more focused on DB-level types than app-level display, but has a clean interaction model.[^29]

- Click **"Add column"** → a compact inline form appears at the bottom of the column list
- Type dropdown is prominent; selecting a type shows/hides relevant constraint inputs (length, default, nullable)
- Name field uses snake_case convention; type is locked after save
- The editor does not attempt to be a full CMS but models the "type-first" flow cleanly

![Supabase table editor — columns are added inline at the bottom of the list with a prominent data type dropdown](https://supabase.com/docs/_next/image?url=%2Fdocs%2Fimg%2Fdatabase%2Fmanaging-tables%2Fcreating-tables.png&w=3840&q=75)

---

### 9e. Notable Differences from Elevator

Elevator's template editor has two concepts that don't map directly to any of these systems:

1. **Two separate orderings** (`templateOrder` vs `viewOrder`) — No CMS reviewed has this. All of them have one field order. This is a uniquely Elevator concept and needs a deliberate UX decision.

2. **`fieldData` as a nested JSON blob** — Other systems express per-type configuration as finely-grained form fields. Elevator currently collapses all of this into an opaque JSON textarea. The new editor's core contribution is replacing the JSON blob with proper UI — exactly what Contentful's "Appearance" and Directus's "Interface" tabs do.

---

## 10. Additional Codebase Findings

### 10a. Form Component Inventory

The following components are available and verified to exist:

| Component | Path | Notes |
|---|---|---|
| `FormPageLayout` | `src/layouts/FormPageLayout.vue` | Full-page admin form shell with title + sticky footer |
| `FormSection` | `src/components/Form/FormSection.vue` | `<section>` with heading, used for logical grouping |
| `FormSubSection` | — | **Not a shared component.** Defined inline in `InstanceSettingsPage.vue` as a local functional component[^23]. Would need to be extracted if reused. |
| `InputGroup` | `src/components/InputGroup/InputGroup.vue` | Labeled text input |
| `TextAreaGroup` | — | Labeled textarea (imported in InstanceSettingsPage; needs path confirmation) |
| `SelectGroup` | — | Labeled `<select>` dropdown (imported in InstanceSettingsPage) |
| `ToggleGroup` | `src/components/ToggleGroup/ToggleGroup.vue` | Labeled boolean toggle |

`FormSubSection` is the "conditional reveal" pattern used to show subordinate fields when a toggle is enabled. It will likely be needed in the template editor (e.g., showing inline edit options only when `displayInline` is true). It should be extracted to a shared component as part of the preparatory refactoring PR.

---

### 10b. DragDropList Component

`src/components/DragDropList/` is a complete drag-and-drop system, not just a single component[^24]:

- **`DragDropList.vue`** — The main list component. Takes `v-model` (array of `HasId` items) + a `listId`. Uses `useDragDropStore` (internal Pinia mini-store keyed by group ID) to sync state.
- **`DragDropListItem.vue`** + **`DragHandle.vue`** — Individual item wrapper and the drag grip.
- **`nextListId` / `prevListId`** props — Enable keyboard navigation between sibling lists. This is the key to a dual-list (templateOrder / viewOrder) approach: two `DragDropList`s linked as prev/next, sharing a `GROUP_ID_PROVIDE_KEY`.
- Items must implement the `HasId` interface: `{ id: string | number; [key: string]: unknown }`. Widget defs would need the widget's DB ID as their `id`.

The component is well-suited for both a single-list (one ordering) and a dual-list (templateOrder + viewOrder) approach.

---

### 10c. Existing Template Query Layer

`src/queries/useTemplateQuery.ts` already provides[^25]:

| Hook | Status |
|---|---|
| `useTemplateQuery(id)` | ✅ Exists — fetches via `fetchTemplate()` |
| `useAllTemplatesQuery()` | ✅ Exists — fetches summary list |
| `useDeleteTemplateMutation()` | ✅ Exists — invalidates list + instance nav |
| `useCreateTemplateMutation()` | ❌ Missing |
| `useUpdateTemplateMutation()` | ❌ Missing |

`fetchTemplate()` calls `/assetManager/getTemplate/:id`, not `/templates/edit/:id`. This means it returns the widgetArray but **not** the admin-only fields (`includeInSearch`, `indexForSearching`, etc.). A new fetcher targeting the admin endpoint will be needed once the backend exposes it as JSON.

---

### 10d. Mock Server Gaps (Frontend-Relevant)

The mock server `templates.ts` has:
- `GET /templates` — list summary ✅
- `DELETE /templates/delete/:id` — ✅

Missing for the new editor:
- `GET /templates/edit/:id` — full template with all admin fields (or a new `/templates/:id` JSON endpoint)
- `POST /templates` or `PUT /templates/:id` — create/update with JSON body
- The mock `db/templates.ts` stores `templateId`, `templateName` and a `widgetArray` but lacks `includeInSearch`, `indexForSearching`, `isHidden`, `recursiveIndexDepth`. These DB fields need to be added to the mock data too.

---

### 10e. Dual-Ordering Approaches (Expanded)

Building on JJ's note and the DragDropList findings, here are five concrete approaches to the templateOrder / viewOrder problem:

**Option A — Keep Separate Sort Page (Status Quo)**
Mirror the legacy `/templates/sort/:id` page in the new UI. The template editor has no reorder UI; a separate "Sort Fields" page handles both orderings side by side.

- ✅ Lowest new complexity, matches legacy mental model
- ❌ Same discoverability problem — curators don't know it exists

**Option B — Single Ordering (Collapse)**
Remove the distinction. Field order is the same in both the editor and the view page. A future enhancement could add per-field width/layout settings instead.

- ✅ Simplest. No dual-list complexity. No hidden sort page.
- ❌ Loses an actual useful feature (curators often want "Title" first in the edit form but a file/media field first on the view page)

**Option C — Tab Toggle in Editor (Recommended for discussion)**
At the top of the widget list, two tabs: **"Edit Order"** and **"View Order"**. Switching tabs shows the same set of widgets re-ordered by the selected order. Each tab is a DragDropList. Saving either list updates that ordering independently.

- ✅ No separate page. Discoverable and in context.
- ✅ DragDropList with `nextListId`/`prevListId` supports keyboard switching between the two lists natively.
- ❌ Two tabs means the user can only see one ordering at a time

**Option D — Sidebar Mini-List (JJ's suggestion)**
The main form shows full widget card UIs. A collapsible sidebar panel shows a compact list of field labels as drag handles for both orderings (stacked vertically or in two columns).

- ✅ Can see both orderings simultaneously
- ❌ More complex layout; sidebar real estate is limited

**Option E — Inline Numeric Inputs**
Each widget card shows two number inputs: `Edit order` and `View order`. User types the desired position number.

- ✅ Very simple to implement
- ❌ Poor UX for lists longer than ~5 fields; mentally harder than drag

---

## Footnotes

[^1]: [`src/types/index.ts` L522–534](../src/types/index.ts) — `Template` interface missing `includeInSearch`, `indexForSearching`, `isHidden`, `templateColor`, `recursiveIndexDepth`.
[^2]: [`src/api/fetchers.ts` L114–128](../src/api/fetchers.ts) — `fetchTemplate()` calls `/assetManager/getTemplate/:id`, which returns the asset-manager view (widget array, collections), not the full admin template entity.
[^3]: [`src/types/index.ts` L80–94](../src/types/index.ts) — `WIDGET_TYPES` constant.
[^4]: [`src/types/index.ts` L96–115](../src/types/index.ts) — `WidgetDef` interface.
[^5]: [`application/models/Entity/Widget.php` L1–150](../../elevator/application/models/Entity/Widget.php) — Doctrine entity mapping all widget columns.
[^6]: [`application/views/templates/_template_js.php` L107–124](../../elevator/application/views/templates/_template_js.php) — `fieldTitle` is auto-derived from the label input: `sanitize(label) + "_" + instanceId`.
[^7]: [`application/views/widget_form_partials/select.php`](../../elevator/application/views/widget_form_partials/select.php) + [`src/types/index.ts` L170–175](../src/types/index.ts) — `SelectWidgetDef.fieldData`.
[^8]: [`src/types/index.ts` L141–152](../src/types/index.ts) — `MultiSelectFieldData` and `MultiSelectWidgetDef`. [`application/views/widget_form_partials/multiselect_inner.php`](../../elevator/application/views/widget_form_partials/multiselect_inner.php) — rendering logic using `getTopLevels()`.
[^9]: [`application/models/widgets/Upload.php`](../../elevator/application/models/widgets/Upload.php) + [`src/types/index.ts` L177–189](../src/types/index.ts) — `UploadWidgetDef.fieldData`.
[^10]: [`application/models/widgets/Related_asset.php`](../../elevator/application/models/widgets/Related_asset.php) + [`src/types/index.ts` L154–168](../src/types/index.ts) — `RelatedAssetWidgetDef.fieldData`.
[^11]: [`application/controllers/Templates.php`](../../elevator/application/controllers/Templates.php) — full controller source.
[^12]: [`application/views/templates/_template_js.php` L41–99](../../elevator/application/views/templates/_template_js.php) — PHP loop rendering existing widgets via Handlebars.
[^13]: [`application/views/templates/_template_js.php` L21–31](../../elevator/application/views/templates/_template_js.php) — `fieldTypeData` array and auto-fill on field type change.
[^14]: [`application/controllers/Templates.php` L138–145](../../elevator/application/controllers/Templates.php) — `deleteQuery` nukes widgets, then re-inserts on every save.
[^15]: [`src/pages/CreateOrEditAssetPage/CreateOrEditAssetPage.vue`](../src/pages/CreateOrEditAssetPage/CreateOrEditAssetPage.vue).
[^16]: [`src/pages/CreateOrEditAssetPage/EditAssetForm/EditAssetForm.vue`](../src/pages/CreateOrEditAssetPage/EditAssetForm/EditAssetForm.vue).
[^17]: [`src/pages/CreateOrEditAssetPage/EditWidget/EditWidgetLayout.vue`](../src/pages/CreateOrEditAssetPage/EditWidget/EditWidgetLayout.vue).
[^18]: [`src/pages/CreateOrEditAssetPage/EditWidget/EditWidget.vue`](../src/pages/CreateOrEditAssetPage/EditWidget/EditWidget.vue).
[^19]: [`src/pages/InstanceSettingsPage/InstanceSettingsPage.vue`](../src/pages/InstanceSettingsPage/InstanceSettingsPage.vue).
[^20]: [`src/pages/CreateOrEditAssetPage/useAssetEditor/useAssetEditor.ts`](../src/pages/CreateOrEditAssetPage/useAssetEditor/useAssetEditor.ts).
[^21]: `src/components/DragDropList/` — existing drag-drop component to evaluate for widget reordering.
[^22]: [`_vibes/templates-api-analysis.md`](./templates-api-analysis.md) — prior analysis noting `Entity\Template::toArray()` is called but not defined.
[^23]: [`src/pages/InstanceSettingsPage/InstanceSettingsPage.vue` L481–490](../src/pages/InstanceSettingsPage/InstanceSettingsPage.vue#L481-L490) — `FormSubSection` defined as a local functional component using JSX, not exported. Must be extracted before reuse.
[^26]: [Contentful Help — Content modeling basics](https://www.contentful.com/help/content-models/content-modelling-basics/) — primary source for Contentful field type picker, field ID derivation, and tab structure (Settings / Validations / Appearance).
[^27]: [Contentful Developer Docs — Data model](https://www.contentful.com/developers/docs/concepts/data-model/) — field types, array fields, and JSON preview.
[^28]: [Directus Docs — Fields](https://directus.io/docs/guides/data-model/fields) — primary source for Directus interface-first creation flow, six-tab configuration panel, field width settings, and immutability warning.
[^29]: [Supabase Docs — Managing tables](https://supabase.com/docs/guides/database/tables) — primary source for Supabase inline column editor and type-first row creation flow.
[^24]: [`src/components/DragDropList/`](../src/components/DragDropList/) — Full DnD system: `DragDropList.vue`, `DragDropListItem.vue`, `DragHandle.vue`, `useDragDropStore.ts`, `dndTypes.ts`. Items require `HasId` interface (`{ id: string | number }`). Two linked lists share a `GROUP_ID_PROVIDE_KEY` injected by a parent `DragDropContainer`.
[^25]: [`src/queries/useTemplateQuery.ts`](../src/queries/useTemplateQuery.ts) — `useTemplateQuery`, `useAllTemplatesQuery`, `useDeleteTemplateMutation` exist. Create/update mutations are absent.
[^note-directsearch]: [`application/controllers/Search.php` L152–165](../../elevator/application/controllers/Search.php) — `directSearch` widgets populate the advanced search modal's field filter list. [`application/controllers/Search.php` L957–970](../../elevator/application/controllers/Search.php) — same widgets populate the sort dropdown via `buildSortStructure()`.
