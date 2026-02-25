---
type: research
subject: "WCAG 2.1 AA requirements for complex forms — criteria, APG patterns, and an audit of the existing Asset Editor"
status: active
created: 2026-02
updated: 2026-02
related-docs:
  - template-editor-research.md
  - template-editor-api-plan.md
---

# Form Accessibility Research — WCAG 2.1 AA

## Summary

- **Covers:** WCAG 2.1 AA success criteria most relevant to admin forms; the four POUR principles; APG keyboard patterns for accordion and combobox; a detailed audit of the existing Asset Editor (`CreateOrEditAssetPage`) with specific failures mapped to SC numbers; prescriptive guidelines for building new form components (template editor and beyond)
- **Does not cover:** WCAG 2.2 (not yet required); mobile-specific concerns; color palette auditing (that requires tooling, not research)
- **Key decisions:** Visible labels are non-negotiable — `sr-only` labels fail 2.4.6 for sighted users; error messages must be programmatically linked to inputs via `aria-describedby`; `title` attributes are not a reliable substitute for `aria-label`; the APG accordion pattern requires `<button>` inside a heading element with `aria-expanded` and `aria-controls`
- **Load when:** Building or reviewing any form component; starting work on the template editor UI; doing an accessibility audit

---

## 1. What Is WCAG 2.1 AA?

The **Web Content Accessibility Guidelines (WCAG) 2.1**[^1] is the W3C standard for web accessibility. It is organized into four principles (POUR) and 78 success criteria (SC), each assigned a conformance level (A, AA, AAA).

**Level AA** is the legal and contractual baseline for most organizations in the US, EU, and UK. It requires all Level A criteria *plus* the Level AA criteria.

The four principles:

| Principle | Question it answers |
|---|---|
| **Perceivable** | Can users perceive all content regardless of sensory ability? |
| **Operable** | Can users operate all UI regardless of input method? |
| **Understandable** | Can users understand the UI and its feedback? |
| **Robust** | Does the UI work reliably across assistive technologies? |

---

## 2. WCAG 2.1 AA Criteria Most Relevant to Complex Forms

This section focuses on the 17 success criteria with the most practical impact on a complex admin form like the template editor. Criteria are organized by principle.

### 2a. Perceivable

**1.1.1 Non-text Content (Level A)**[^2]
Every non-text element that conveys information must have a text alternative. For icon-only buttons this means `aria-label` — not `title`, which is suppressed on touch devices and unreliable in screen readers.

```html
<!-- ❌ Fails: title is not reliably announced -->
<button title="Expand All"><ChevronIcon /></button>

<!-- ✅ Passes -->
<button aria-label="Expand All"><ChevronIcon /></button>
```

**1.3.1 Info and Relationships (Level A)**[^3]
Structure, relationships, and meaning conveyed visually must also be conveyed programmatically. This is the broadest form-relevance criterion — it covers:
- Label/input associations (via `<label for>` or `aria-labelledby`)
- Grouping of related fields (via `<fieldset>/<legend>` or `role="group"`)
- Required field indication (via `aria-required` or a visible legend)
- Error associations (via `aria-describedby` linking error text to the input)

**1.3.5 Identify Input Purpose (Level AA)**[^4]
Inputs that collect personal information about the user must have an `autocomplete` attribute. For Elevator this applies to: name, email, and username fields in login/registration. Not relevant to metadata entry widgets.

**1.4.1 Use of Color (Level A)**[^5]
Color must not be the *only* visual means of conveying information. An error state shown *only* as a red border without an icon, label change, or text message fails. The combination required: color + icon + text.

```html
<!-- ❌ Fails: color alone -->
<input class="border-red-500" />

<!-- ✅ Passes: color + icon + text -->
<input class="border-error" aria-invalid="true" aria-describedby="err-title" />
<p id="err-title" class="text-error flex gap-1">
  <TriangleAlertIcon aria-hidden="true" /> Title is required
</p>
```

**1.4.3 Contrast Minimum (Level AA)**[^6]
- Normal text (< 18pt / < 14pt bold): **4.5:1** contrast ratio against background
- Large text (≥ 18pt / ≥ 14pt bold): **3:1**
- Incidental text (disabled controls, decorative): exempt

**1.4.11 Non-text Contrast (Level AA)**[^7]
UI component boundaries (input borders, focus rings, icon buttons) require **3:1** against adjacent colors. This is often failed by subtle input borders on light backgrounds.

**1.4.13 Content on Hover or Focus (Level AA)**[^8]
Tooltips and popovers that appear on hover/focus must be:
1. **Dismissible** — user can dismiss without moving focus (usually `Escape`)
2. **Hoverable** — the tooltip itself can be hovered without disappearing
3. **Persistent** — stays visible until dismissed or focus moves away

This applies to every `<Tooltip>` component in the asset editor and template editor.

---

### 2b. Operable

**2.1.1 Keyboard (Level A)**[^9]
*All* functionality must be operable via keyboard alone, with no keyboard traps. This is the single most important criterion for complex interactive widgets like drag-and-drop lists, accordions, and comboboxes.

> **Drag-and-drop note:** There is no official APG pattern for DnD. The W3C guidance is that any drag-and-drop interaction must have an *equivalent* keyboard alternative (e.g., cut/paste-style reorder via arrow keys or a separate reorder mode). The existing `DragDropList` component provides `nextListId`/`prevListId` for inter-list keyboard navigation but has no documented keyboard reorder mechanism within a single list.

**2.4.3 Focus Order (Level A)**[^10]
When navigated sequentially, focus order must preserve meaning and operability. In a form with a sidebar, the DOM order should place the sidebar after the main content, or `tabindex` management is needed. Hidden elements (`class="sr-only"`, `visibility: hidden`, `display: none`) remove items from tab order — elements that are visually present should generally remain focusable.

**2.4.6 Headings and Labels (Level AA)**[^11]
Every heading and every label must *describe* the topic or purpose. A label that is `sr-only` fails for sighted users even if it passes for screen reader users — **both groups must be served**. This is the criterion that `EditTextWidget`'s `sr-only` input labels fail.

**2.4.7 Focus Visible (Level AA)**[^12]
A visible focus indicator must be present for all interactive elements. Tailwind's default `focus:outline-none` without a replacement visible focus style is a common failure. WCAG 2.2 upgraded this to AA with stricter requirements (3:1 contrast for the indicator itself) — worth implementing to future-proof.

---

### 2c. Understandable

**3.3.1 Error Identification (Level A)**[^13]
If an error is automatically detected, the item in error must be *identified* and the error *described in text*. The text must be programmatically associated with the field so screen readers announce it.

```html
<!-- ❌ Fails: error text exists but is not associated with the input -->
<input id="title" />
<p class="text-error">Title is required</p>

<!-- ✅ Passes: aria-describedby links the error to the input -->
<input id="title" aria-invalid="true" aria-describedby="title-error" />
<p id="title-error" role="alert" class="text-error">Title is required</p>
```

**3.3.2 Labels or Instructions (Level A)**[^14]
All inputs must have a visible label. If additional formatting requirements exist (e.g., "date must be YYYY-MM-DD"), those instructions must be visible *before* the user submits. Placeholder text does not satisfy this criterion — placeholders disappear and have insufficient contrast.

**3.3.3 Error Suggestion (Level AA)**[^15]
When an error is detected and a suggestion is known, the suggestion must be provided. "Invalid date" is insufficient. "Invalid date — use format YYYY-MM-DD" passes.

**3.3.4 Error Prevention (Level AA)**[^16]
For pages that submit data that is *legal, financial, or modifiable user data*, at least one of the following must be true:
1. Reversible — submission can be undone
2. Checked — data is checked and user can correct
3. Confirmed — a confirmation step is provided

The "delete widget" action and the "change template" confirmation modal in `CreateOrEditAssetPage` are correct implementations of this criterion.

---

### 2d. Robust

**4.1.2 Name, Role, Value (Level A)**[^17]
Every UI component must have:
- An accessible **name** (what AT announces as the label)
- An exposed **role** (what kind of element it is)
- **Values and states** that can be determined programmatically (`aria-expanded`, `aria-selected`, `aria-checked`, `aria-required`, `aria-invalid`)

Custom components built with `<div>` or `<span>` are the most common failure. Always prefer native HTML elements; add ARIA only when native elements are insufficient.

**4.1.3 Status Messages (Level AA)**[^18]
Status messages (save success/failure, validation summaries) must be perceivable by screen readers *without* receiving focus. Implementations:
- `role="alert"` — announces immediately (use for errors, destructive actions)
- `role="status"` or `aria-live="polite"` — announces when idle (use for success messages, progress)
- `aria-live="assertive"` — interrupts current announcement (use sparingly — only for critical errors)

```html
<!-- ✅ Save success — polite, non-interrupting -->
<div role="status" aria-live="polite">Changes saved successfully.</div>

<!-- ✅ Validation error — immediate assertion -->
<div role="alert">3 required fields are missing.</div>
```

---

## 3. APG Patterns for Forms

The ARIA Authoring Practices Guide (APG)[^19] provides keyboard interaction specifications for common widget patterns. These are the patterns directly relevant to Elevator's complex form pages.

### 3a. Accordion Pattern

Source: [APG Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)[^20]

An accordion is a series of interactive headings that reveal/hide panels. Each widget card in `EditWidget` is an accordion item.

**Required structure:**
```html
<h2>  <!-- heading at appropriate level -->
  <button
    type="button"
    aria-expanded="true|false"
    aria-controls="panel-id">
    Widget Label
  </button>
</h2>
<div
  id="panel-id"
  role="region"              <!-- optional, omit if > ~6 items -->
  aria-labelledby="btn-id">
  <!-- panel content -->
</div>
```

**Required keyboard behavior:**

| Key | Action |
|---|---|
| `Enter` / `Space` | Toggle panel open/closed |
| `Tab` | Move to next focusable element (inside the panel if open, or to next header) |
| `Shift+Tab` | Move to previous focusable element |
| `↓` (optional) | Move focus to next accordion header |
| `↑` (optional) | Move focus to previous accordion header |
| `Home` (optional) | Move focus to first accordion header |
| `End` (optional) | Move focus to last accordion header |

**`region` landmark note:** Use `role="region"` + `aria-labelledby` on the panel *only* if the form has approximately 6 or fewer expandable panels. More than ~6 regions creates landmark proliferation that makes screen reader navigation harder, not easier.

**What `EditWidgetLayout` currently does right ✅**
- `<button>` with `:aria-expanded="isOpen"` ✅
- `:aria-controls` pointing to the panel div ✅
- Clicking the collapsed section expands it ✅

**What `EditWidgetLayout` currently does wrong ❌**
- `aria-labelledby="${widgetInstanceId}-heading"` on the panel div references a `-heading` ID that is *never assigned* in the template. The `<h2>` has no `id` attribute.
- The `<button>` has no `id`, so the panel cannot `aria-labelledby` the button correctly either.
- `useFocusWithin(editLayoutContentsRef.value)` passes `null` to the composable at setup time (the `.value` is `null` until mount). The correct call is `useFocusWithin(editLayoutContentsRef)` — passing the reactive ref itself, not its value.

### 3b. Combobox Pattern

Source: [APG Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)[^21]

A combobox is an input with an associated popup (listbox, grid, or dialog). `AutoCompleteInput` is the primary combobox in the asset editor.

**Required ARIA:**
```html
<input
  role="combobox"
  aria-expanded="true|false"
  aria-controls="listbox-id"
  aria-autocomplete="list"
  aria-activedescendant="option-id-of-focused-item" />

<ul id="listbox-id" role="listbox">
  <li id="option-1" role="option" aria-selected="false">Option 1</li>
  <li id="option-2" role="option" aria-selected="true">Option 2</li>
</ul>
```

**Required keyboard behavior (listbox popup):**

| Key | Action |
|---|---|
| `↓` | Open popup / move to next option |
| `↑` | Move to previous option (optional: open popup placing focus on last option) |
| `Enter` | Accept focused option, close popup |
| `Escape` | Close popup, return focus to input |
| `Tab` | Popup and its descendants are **excluded** from tab sequence |
| Printable chars | Type in input, refine suggestions |

**Key implementation note:** DOM focus stays on the `<input>` at all times. Keyboard focus within the popup is simulated via `aria-activedescendant`. Never move actual DOM focus into the listbox items.

**What `AutoCompleteInput` currently does right ✅**
- `role="combobox"`, `aria-expanded`, `aria-activedescendant`, `aria-autocomplete="list"` ✅
- `role="listbox"` on popup, `role="option"` + `aria-selected` on items ✅

**What `AutoCompleteInput` currently does wrong ❌**
- Loading and empty-state messages inside the popup are plain `<div>`s. They should be in a `role="status"` region or use `aria-live="polite"` so screen readers announce when results load or no results are found.

---

## 4. Asset Editor Audit — `CreateOrEditAssetPage`

This section audits the existing asset editor page and its child components for WCAG 2.1 AA compliance. It serves as a case study for what to avoid in the template editor.

### 4a. What the Asset Editor Does Well ✅

- **Destructive action confirmations** — Both the "change template" and "migrate collection" flows show a `ConfirmModal` before data loss. This satisfies **3.3.4 Error Prevention**.
- **Combobox ARIA** — `AutoCompleteInput` implements the APG combobox pattern correctly for its core role/state attributes.
- **Input ID generation** — `InputGroup` uses Vue's `useId()` for stable `id`/`for` pairing, avoiding collisions.
- **Required field indication** — `EditWidgetLayout` shows a visible `*` next to required field labels.
- **Validation state icons** — Uses `<Tooltip>` with check/warning icons (color + icon, satisfying **1.4.1** partially).
- **Keyboard-accessible accordion toggle** — The expand/collapse `<button>` is a native button element that receives focus and responds to keyboard activation.

### 4b. Failures — Mapped to WCAG Success Criteria

#### F1 — `EditWidgetLayout`: Broken `aria-labelledby` reference

**File:** [src/pages/CreateOrEditAssetPage/EditWidget/EditWidgetLayout.vue](../src/pages/CreateOrEditAssetPage/EditWidget/EditWidgetLayout.vue)
**WCAG:** 1.3.1 Info and Relationships (A), 4.1.2 Name, Role, Value (A)

The content panel div has `aria-labelledby="${widgetInstanceId}-heading"` but no element in the template has `id="${widgetInstanceId}-heading"`. The association is silently broken — screen readers ignore `aria-labelledby` that points to a nonexistent ID.

```html
<!-- ❌ Current — -heading ID never defined -->
<div :aria-labelledby="`${widgetInstanceId}-heading`">

<!-- ✅ Fix — use button id for labelledby, or assign id to the heading -->
<button :id="`${widgetInstanceId}-btn`" ...>{{ widgetDef.label }}</button>
<div :aria-labelledby="`${widgetInstanceId}-btn`">
```

#### F2 — `EditWidgetLayout`: `useFocusWithin` called with null

**File:** [src/pages/CreateOrEditAssetPage/EditWidget/EditWidgetLayout.vue](../src/pages/CreateOrEditAssetPage/EditWidget/EditWidgetLayout.vue)
**WCAG:** Not a WCAG issue — this is a functional bug that silently disables the auto-expand-on-focus behavior
**Impact:** A keyboard user who tabs into a collapsed widget's hidden inputs will not see the widget expand to reveal them.

```ts
// ❌ Current — .value is null at setup time
const { focused: isFocusedWithin } = useFocusWithin(editLayoutContentsRef.value);

// ✅ Fix — pass the ref itself; VueUse will track it reactively
const { focused: isFocusedWithin } = useFocusWithin(editLayoutContentsRef);
```

#### F3 — `EditTextWidget` / `EditSelectWidget`: `sr-only` labels

**File:** `EditTextWidget.vue`, `EditSelectWidget.vue`
**WCAG:** 2.4.6 Headings and Labels (AA), 3.3.2 Labels or Instructions (A)

The label is `class="sr-only"` (or `showLabel="false"` for the select). Sighted users have no visible label on the input itself — they must infer the field's purpose from the accordion header above. This is an accessibility failure and a usability failure.

![W3C Forms Tutorial — visible labels are required; placeholder text is insufficient](https://www.w3.org/WAI/tutorials/images/placeholder-labelling-decision.png)

*Source: W3C WAI Forms Tutorial[^22]*

The accordion header is visually close, but it is not a form label — it's a heading/button. When the form is used with zoom at 400% or with a screen reader in forms mode, the association breaks.

```html
<!-- ❌ Current — label hidden from sighted users -->
<label class="sr-only" :for="inputId">{{ widgetDef.label }}</label>
<input :id="inputId" />

<!-- ✅ Fix — visible label, always -->
<label :for="inputId">{{ widgetDef.label }}</label>
<input :id="inputId" />
```

#### F4 — `IconButton` component: `title` attribute is not a reliable accessible name

**File:** [src/components/IconButton/IconButton.vue](../src/components/IconButton/IconButton.vue)
**WCAG:** 1.1.1 Non-text Content (A)

`IconButton` accepts a required `title` prop and renders it as the HTML `title` attribute on the underlying button. The `title` attribute is announced inconsistently — suppressed on touch, unreliable across screen reader / browser combos, and only appears on hover, not focus. The component does not set `aria-label`.

Callers work around this inconsistently. `AddToDrawerButton` and `ShareButton` manually add `<span class="sr-only">...</span>` inside the slot. `TemplatesTableColumns` and `AddToEmbeddedPluginButton` do not, leaving those icon buttons without a reliable accessible name.

The fix is at the component level — not per-caller:

```vue
<!-- ✅ Fix in IconButton.vue: add :aria-label="title" -->
<component
  :is="componentType"
  :title="title"
  :aria-label="title"
  ...>
  <slot />
</component>
```

This applies a correct accessible name to every existing caller in one change. See Section 6 for the `sr-only` vs `aria-label` tradeoff discussion.

#### F5 — `EditDateWidgetContentItem`: Error messages not associated with inputs

**File:** `EditDateWidgetContentItem.vue`
**WCAG:** 3.3.1 Error Identification (A), 1.4.1 Use of Color (A)

Error messages are rendered in `<p>` tags with `class="text-error"` but without `role="alert"` or `aria-live`, and without `aria-describedby` linking them to the invalid input. Screen readers do not announce these errors. The error state is also communicated only via red text color (fails 1.4.1).

```html
<!-- ❌ Current -->
<input :id="id" />
<p class="text-error">{{ errorMessage }}</p>

<!-- ✅ Fix -->
<input
  :id="id"
  :aria-invalid="!!errorMessage"
  :aria-describedby="errorMessage ? `${id}-error` : undefined" />
<p
  v-if="errorMessage"
  :id="`${id}-error`"
  role="alert"
  class="text-error flex gap-1 items-center">
  <TriangleAlertIcon class="w-4 h-4 shrink-0" aria-hidden="true" />
  {{ errorMessage }}
</p>
```

#### F6 — `SelectGroup`: `readonly` on `<select>` element

**File:** `src/components/SelectGroup/SelectGroup.vue`
**WCAG:** 4.1.1 Parsing (A) — while this criterion was removed in WCAG 2.2, it reflects broken HTML semantics

`readonly` is not a valid attribute for `<select>` elements (unlike `<input>` and `<textarea>`). It has no effect. The component appears to intend `disabled` for certain states. This is a latent bug, not currently causing a direct AT failure, but it signals that this component's HTML validity should be reviewed before reuse.

#### F7 — `EditAssetFormSidebar`: Validation errors not associated with fields

**File:** `src/pages/CreateOrEditAssetPage/EditAssetForm/EditAssetFormSidebar.vue`
**WCAG:** 3.3.1 Error Identification (A), 1.3.1 Info and Relationships (A)

The sidebar lists field names with "Missing required" or "Invalid" labels as plain text. There is no programmatic connection between the sidebar error list and the form fields that have errors. A screen reader user sees a list of names but cannot navigate to the invalid fields from the error summary.

The correct pattern (analogous to a skip-nav link) is to link each error summary item to its corresponding invalid input:

```html
<!-- ✅ Accessible error summary with links -->
<div role="alert" aria-live="polite">
  <p>Please fix the following errors:</p>
  <ul>
    <li v-for="error in validationErrors">
      <a :href="`#${error.fieldId}`">{{ error.label }}: {{ error.message }}</a>
    </li>
  </ul>
</div>
```

#### F8 — `EditWidgetLayout`: Invisible "Set as Primary" button in tab order

**File:** [src/pages/CreateOrEditAssetPage/EditWidget/EditWidgetLayout.vue](../src/pages/CreateOrEditAssetPage/EditWidget/EditWidgetLayout.vue)
**WCAG:** 2.4.3 Focus Order (A), 2.1.1 Keyboard (A)

When only one item exists, the "Set as Primary" button gets `class="invisible"` — it is still in the tab order. A keyboard user tabs to a button they cannot see. The fix:

```html
<!-- ❌ invisible keeps it in tab order -->
:class="{ invisible: widgetContents.length < 2 }"

<!-- ✅ aria-hidden + tabindex removes it entirely when not needed -->
:aria-hidden="widgetContents.length < 2 ? 'true' : undefined"
:tabindex="widgetContents.length < 2 ? -1 : undefined"
```

#### F9 — `EditWidgetLayout`: Delete button `sr-only` when collapsed

**File:** [src/pages/CreateOrEditAssetPage/EditWidget/EditWidgetLayout.vue](../src/pages/CreateOrEditAssetPage/EditWidget/EditWidgetLayout.vue)
**WCAG:** 2.1.1 Keyboard (A)

The delete button receives `class="sr-only"` when the widget is collapsed. `sr-only` removes the element from visual rendering while keeping it in the accessibility tree — this means it's *invisible* to sighted users and *focusable* by keyboard users, which is the reverse of the intended behavior. Use `aria-hidden="true"` + `tabindex="-1"` when collapsed (or better, `v-show` with `display: none`).

#### F10 — `EditAssetForm`/`EditWidgetLayout`: `<section>` and `<aside>` without accessible names

**File:** `EditAssetForm.vue`, `EditWidgetLayout.vue`
**WCAG:** 1.3.1 Info and Relationships (A)

`<section>` and `<aside>` elements create landmark regions only when they have an accessible name. An unnamed `<section>` is not announced as a region at all — it's treated as a generic container. Add `aria-label` or `aria-labelledby` to every landmark element.

```html
<!-- ❌ unnamed section — not a landmark -->
<section class="p-4 max-w-screen-xl">

<!-- ✅ named section — announces as "Asset Fields region" -->
<section aria-label="Asset Fields" class="p-4 max-w-screen-xl">

<!-- ❌ unnamed aside -->
<aside class="sidebar-container">

<!-- ✅ named aside -->
<aside aria-label="Save and Validation" class="sidebar-container">
```

---

## 5. `CreateOrEditAssetPage` Specific Review

The outer page shell (`CreateOrEditAssetPage.vue`) is architecturally a 3-state form (template/collection selection → loading → edit form). Accessibility notes specific to this component:

**What works well:**
- The template/collection selection form uses native `<SelectGroup>` with `required` props — native `<select>` elements have built-in AT support ✅
- `ConfirmModal` for template/collection changes implements 3.3.4 Error Prevention ✅
- `SpinnerIcon` shows during loading — it should have `role="status"` and either `aria-label="Loading"` or a visually hidden text label for AT

**What needs improvement:**
- The loading spinner `<SpinnerIcon class="w-8 h-8 animate-spin">` followed by `<span class="ml-2">Loading...</span>` is not wrapped in a `role="status"` or `aria-live` container, so the appearance of the spinner is not announced to screen readers
- On transition from the selection form to `EditAssetForm`, focus is not managed. After the form loads, focus should be moved to the form heading or the first field so keyboard/AT users are oriented in the new content
- The `<Transition name="fade">` wrapping `EditAssetForm` provides no AT equivalent for the visual transition

---

## 6. Guidelines for New Component Development

Apply these rules when building the template editor (and all future form components):

### Labels

1. **Always visible** — never `sr-only` on an input label that a sighted user needs.
2. **Use `<label for>` or `aria-labelledby`** — never `title`, never placeholder-only.
3. **Describe the field purpose**, not the action — "Widget Label" not "Enter text here".

### Error Handling

1. **Inline errors require `aria-describedby`** — link error `id` to the input that caused it.
2. **Use `aria-invalid="true"`** on inputs in error state.
3. **Use `role="alert"`** for errors that appear after user action (validation on submit, async errors).
4. **Use `role="status"`** for success messages and passive status changes.
5. **Never rely on color alone** — always pair error color with an icon and text.
6. **Error summaries should link to the invalid fields** — each summary item is an anchor pointing to the field's `id`.

### Accordion / Widget Cards

1. **Button inside heading** — `<hN><button aria-expanded aria-controls>label</button></hN>` — the exact APG structure.
2. **Panel ID** — ensure the `aria-controls` value matches a real element `id` in the DOM.
3. **Panel labelling** — `aria-labelledby` on the panel must point to an element that actually exists (the button's `id`).
4. **`useFocusWithin`** — pass the `Ref` itself, not `.value`.
5. **Avoid `role="region"`** on panels when more than ~6 panels can be expanded simultaneously.

### Icon Buttons

1. **Never use the HTML `title` attribute as the only accessible name** — it is suppressed on touch, unreliable across screen reader / browser combos, and only shown on hover.
2. **Preferred:** `<span class="sr-only">Label</span>` inside the button. Real DOM text is translated by browser translation extensions; `aria-label` values are not. This matters for multilingual users.
3. **Also acceptable:** `aria-label="Label"` on the button. Screen reader output is identical. Choose consistency over purity — if a shared component needs a single mechanism, `aria-label` set from a required prop works for all callers automatically.
4. Add `aria-hidden="true"` on the icon element itself; otherwise SVG `<title>` elements may be concatenated into the accessible name.
5. For toggle buttons, use `aria-pressed` (toggle states) or `aria-expanded` (show/hide states).

> **"No ARIA is better than bad ARIA"** — this principle applies to *incorrect* ARIA (e.g., `role="button"` on a `<div>` instead of using `<button>`). Using `aria-label` on a `<button>` is spec-correct; the principle does not discourage it.

### Custom Select / Combobox

1. Follow the APG combobox pattern exactly — `role="combobox"`, `aria-controls`, `aria-expanded`, `aria-activedescendant`.
2. **DOM focus stays on the input** — never move focus into the listbox.
3. Announce loading/empty states with `aria-live="polite"` inside the popup.
4. `Escape` must close the popup and return focus to the input.

### Save / Mutation Status

1. Wrap save status in `aria-live="polite"` — users should hear "Saved" without focus moving.
2. Wrap save errors in `role="alert"` — errors are urgent.
3. `disabled` on the save button is not sufficient — add a visible, non-color-only indicator that the form has unsaved changes or is invalid.

### Focus Management

1. After a modal opens, move focus to the modal's first focusable element.
2. After a modal closes, return focus to the trigger.
3. After a long async operation (template load, save), move focus to a meaningful heading.
4. When a new accordion panel opens, focus should remain on the toggle button (do not auto-move into the panel).

### Invisible Elements

| Intent | Correct technique |
|---|---|
| Visible to all | No special class |
| Visible to AT only (truly supplemental text) | `sr-only` |
| Hidden from all (not interactive) | `hidden` or `display: none` |
| Hidden from all (but keeps space) | `invisible` + `aria-hidden="true"` + `tabindex="-1"` |
| Hidden from AT only (decorative) | `aria-hidden="true"` |
| Temporarily disabled | `disabled` (for controls), `aria-disabled="true"` (for custom elements) |

---

## 7. Checklist — Per Component

Use this checklist when building or reviewing any form component:

- [ ] Every input has a **visible label** (not placeholder, not `sr-only`)
- [ ] Every label is programmatically associated (`<label for>`, `aria-labelledby`, or `aria-label`)
- [ ] Error messages have `aria-describedby` linking them to the input
- [ ] Invalid inputs have `aria-invalid="true"`
- [ ] Error messages use `role="alert"`; success messages use `role="status"`
- [ ] Errors use color + icon + text (never color alone)
- [ ] Icon-only buttons have `aria-label` (not `title`)
- [ ] Icons inside buttons have `aria-hidden="true"`
- [ ] Accordion/disclosure: `<button aria-expanded aria-controls>` inside `<hN>`
- [ ] `aria-controls` / `aria-labelledby` IDs are actually present in the DOM
- [ ] All landmark elements (`<section>`, `<aside>`, `<nav>`) have accessible names
- [ ] There are no `invisible` elements still in the tab order
- [ ] Focus is managed after transitions (modal open/close, section load)
- [ ] Keyboard-only navigation test completed without traps

---

## Footnotes

[^1]: [WCAG 2.1 — W3C Recommendation](https://www.w3.org/TR/WCAG21/) — The normative specification. This is the primary authoriative source; all other WAI materials are informative.
[^2]: [SC 1.1.1 Non-text Content (A)](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content) — Understanding document with techniques and failures.
[^3]: [SC 1.3.1 Info and Relationships (A)](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships) — The broadest structural criterion; most complex to get right.
[^4]: [SC 1.3.5 Identify Input Purpose (AA)](https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose)
[^5]: [SC 1.4.1 Use of Color (A)](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color)
[^6]: [SC 1.4.3 Contrast Minimum (AA)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum)
[^7]: [SC 1.4.11 Non-text Contrast (AA)](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast)
[^8]: [SC 1.4.13 Content on Hover or Focus (AA)](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus)
[^9]: [SC 2.1.1 Keyboard (A)](https://www.w3.org/WAI/WCAG21/Understanding/keyboard)
[^10]: [SC 2.4.3 Focus Order (A)](https://www.w3.org/WAI/WCAG21/Understanding/focus-order)
[^11]: [SC 2.4.6 Headings and Labels (AA)](https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels)
[^12]: [SC 2.4.7 Focus Visible (AA)](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible)
[^13]: [SC 3.3.1 Error Identification (A)](https://www.w3.org/WAI/WCAG21/Understanding/error-identification)
[^14]: [SC 3.3.2 Labels or Instructions (A)](https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions)
[^15]: [SC 3.3.3 Error Suggestion (AA)](https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion)
[^16]: [SC 3.3.4 Error Prevention (AA)](https://www.w3.org/WAI/WCAG21/Understanding/error-prevention-legal-financial-data)
[^17]: [SC 4.1.2 Name, Role, Value (A)](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value)
[^18]: [SC 4.1.3 Status Messages (AA)](https://www.w3.org/WAI/WCAG21/Understanding/status-messages)
[^19]: [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/) — Keyboard patterns and ARIA usage for common UI widgets. Informative, not normative — but the de-facto standard for widget ARIA.
[^20]: [APG Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) — `<button aria-expanded aria-controls>` inside a heading; `aria-labelledby` on optional `role="region"` panel. Includes a live example.
[^21]: [APG Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — `role="combobox"`, `aria-controls`, `aria-expanded`, `aria-activedescendant`. DOM focus stays on the input; navigation within the popup is virtual.
[^22]: [W3C WAI Forms Tutorial](https://www.w3.org/WAI/tutorials/forms/) — Practical tutorial covering labeling, grouping, validation, error messages, and custom controls. Maps explicitly to relevant WCAG 2.1 SC.
