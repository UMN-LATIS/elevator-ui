# Unmerged Branches Analysis

_Generated: 2026-03-10 · Branches compared against `develop` @ `4066965`_

---

## Summary

| Branch | Status | Action |
|---|---|---|
| `feature/fix-typo` | ✅ Already merged | **Delete** |
| `b3e3b90` | ✅ Already merged | **Delete** |
| `feature/fix-gap-when-no-sidecars-in-edit-widget-view` | ⚠️ Partial (1-liner missing) | **Copilot can apply fix** |
| `feature/fix-child-collection-formatting-on-all-collections-page` | 🔧 WIP, real problem | **Rebase + clean up** |
| `feature/custom-script-handling` | 🔧 Partially superseded | **Rebase + re-scope** |
| `copilot/sub-pr-449` | ⚠️ Review feedback, mostly applied | **Review 6 residual diffs** |

---

## Branch-by-Branch Details

---

### 1. `feature/fix-typo`

**Status: ✅ Already merged — safe to delete**

**What it does:** Fixes a two-character typo ("add missing c") in `src/stores/instanceStore.ts`.

**Findings:** The branch tip commit (`669ad17`) appears verbatim in `develop`'s git history (the branch was merged without squashing). This is also tagged as **`v1.2.0`**. The branch is just a stale pointer — there is nothing unique here.

**Recommendation:** Delete the branch.

```
git push origin --delete feature/fix-typo
```

---

### 2. `b3e3b90`

**Status: ✅ Already merged — safe to delete**

**What it does:** Fixes upload widget behavior when `allowMultiple: false` (was originally PR #329).

**Findings:** The branch is named after a commit SHA. That commit (`b3e3b904`) appears verbatim in `develop`'s git history — it was merged into develop long ago. The branch appears to be an accidental/leftover branch created from a raw commit SHA.

**Recommendation:** Delete the branch.

```
git push origin --delete b3e3b90
```

---

### 3. `feature/fix-gap-when-no-sidecars-in-edit-widget-view`

**Status: ⚠️ One-liner fix not yet in develop**

**What it does:** The branch has exactly **one unique commit** (`60f2147 fix spacing for edit widget view`) with two changes to `EditUploadWidgetItem.vue`:

1. `gap-y-3` → `gap-y-2` — **already applied in develop**
2. `v-if="Object.keys(item.sidecars).length"` on `<EditUploadWidgetItemSidecars>` — **NOT yet in develop**

**The problem it solves:** When an uploaded file has no sidecars, an empty `<EditUploadWidgetItemSidecars>` div is still rendered, creating an invisible gap in the UI.

**Findings:**
- The branch is **56 commits behind develop** (merge base: `9b80658`).
- The gap-y fix was already incorporated into develop independently.
- The `v-if` guard is still missing from develop.
- No open PR exists for this branch.

**Recommendation:** Don't bother rebasing the branch. Just apply the one-liner to develop directly and delete the branch.

> **Tell Copilot:**
> _"In `src/pages/CreateOrEditAssetPage/EditWidget/EditUploadWidget/EditUploadWidgetItem.vue`, add `v-if="Object.keys(item.sidecars).length"` to the `<EditUploadWidgetItemSidecars>` component so it's only rendered when sidecars exist. Then delete the branch `feature/fix-gap-when-no-sidecars-in-edit-widget-view`."_

---

### 4. `feature/fix-child-collection-formatting-on-all-collections-page`

**Status: 🔧 Real improvement, WIP, needs rebase and cleanup**

**What it does:** Improves the visual design of `CollectionItem.vue` on the All Collections page. The 5 unique commits (from merge base `d7ba398`) make these changes:

- Replaces the `ChevronDownIcon` from `@/icons` with `ChevronDown`/`ChevronRight` from `lucide-vue-next` — shows a right-pointing arrow when collapsed, down arrow when expanded (more intuitive)
- Adds a `nestingLevel` prop to `CollectionItem` to allow level-aware padding/styling
- Separates the expand button from the link area for cleaner hit targets
- Adds mock server test data with parent/child/grandchild collections to exercise the UI

**Current develop state:** The develop branch still has the old `ChevronDownIcon` (rotating `-90deg` on collapse), no `nestingLevel` prop, and no nested test data in the mock server.

**The problem it solves:** Child collection display doesn't visually indicate nesting depth, and the expand toggle behavior is less intuitive.

**Findings:**
- The branch is **61 commits behind develop**.
- Commit messages are clearly WIP: `rrrr`, `center`, `less padding for children` — not merge-ready.
- The approach (using `lucide-vue-next` icons directly and a `nestingLevel` prop) is consistent with patterns already used in develop.
- No open PR.

**Recommendation:** Rebase on develop, squash into a single clean commit, and open a PR.

> **Tell Copilot:**
> _"Please rebase `feature/fix-child-collection-formatting-on-all-collections-page` on top of the current `develop` branch and resolve any conflicts. Squash all 5 commits into a single commit with a descriptive message. Then open a PR to develop. If conflicts arise in `CollectionItem.vue`, preserve the branch's intent (adding the `nestingLevel` prop, using `ChevronDown`/`ChevronRight` from `lucide-vue-next`, separating the expand button from the link). Don't forget to also keep the nested mock-server collection test data."_

---

### 5. `feature/custom-script-handling`

**Status: 🔧 Core feature not in develop — partially superseded, needs re-scoping**

**What it does:** The branch (8 unique commits from merge base `7265fbe`) adds the ability for `<script>` tags in custom headers and footers to actually execute, and fires custom events when page content and images are loaded.

**Key changes in the branch:**
- Adds `allowScripts` prop to `SanitizedHTML.vue` — when true, scripts are extracted and appended to `<body>` to execute
- Emits `contentLoaded` and `imagesLoaded` events from `SanitizedHTML`
- Adds `ELEVATOR_EVENTS` constants and fires them from `HomePage` and `StaticContentPage`
- Adds `src/helpers/onImagesLoaded.ts`

**What develop already has (these parts are superseded):**
- `src/helpers/customScriptHelpers.ts` — full helpers for `getScriptsFromHTML`, `executeScripts`, `removeScripts` (more robust than the branch version)
- `src/helpers/onAllImagesLoaded.ts` — improved `onImagesLoaded` with timeout, cleanup, AbortController (superior to the branch's version)
- `ELEVATOR_EVENTS.STATIC_CONTENT_PAGE` with `CONTENT_LOADED` / `IMAGES_LOADED` constants
- Event dispatching in `StaticContentPage.vue` and `HomePage.vue` using the above

**What develop is still missing (this part is NOT superseded):**
- `SanitizedHTML.vue` in develop **does not have an `allowScripts` prop** — it strips all scripts
- `CustomAppHeader.vue` and `AppFooter.vue` do **not execute scripts** from custom header/footer HTML
- The `customScriptHelpers.ts` exists but is not wired up to `SanitizedHTML`

**The problem it solves:** Instances that embed `<script>` tags in their custom app header/footer content currently have those scripts silently stripped. This is a real use case.

**Recommendation:** Rebase on develop, throw away the parts already handled (the `onImagesLoaded` helper, event dispatching), and focus only on the `allowScripts` prop for `SanitizedHTML` — but use the existing `customScriptHelpers.ts` from develop instead of the branch's own implementation.

> **Tell Copilot:**
> _"Rebase `feature/custom-script-handling` on the current `develop` branch. The goal is to add an `allowScripts` boolean prop to `SanitizedHTML.vue` that, when `true`, extracts and executes `<script>` tags from the sanitized HTML using the existing `getScriptsFromHTML` and `executeScripts` helpers from `src/helpers/customScriptHelpers.ts`. When `false` (the default), scripts remain stripped as today. Set `allowScripts={true}` in `CustomAppHeader.vue` and `AppFooter.vue`. Discard changes to `onImagesLoaded`, `ELEVATOR_EVENTS`, and event dispatching — those are already handled differently in develop. Then open a PR to develop."_

---

### 6. `copilot/sub-pr-449`

**Status: ⚠️ Sub-PR review feedback — most fixes applied, 6 files still differ**

**Background:** This branch was created by Copilot as PR #458 ("Address automated review feedback on Template Editor PR") to address code review feedback on the big Template Editor PR #449. PR #458 was **closed without merging**. PR #449 was squash-merged into develop as `6396db6 Template Editor Frontend (#449)`. Most of the review feedback from #458 made it into the `feat/template-editor-front-end` branch before it was merged.

**What's still different vs develop:** After diffing the branch tip against current `develop`, 6 files still differ:

| File | What's different |
|---|---|
| `Button.vue` | `tertiary` variant: branch removes `p-2 text-xs uppercase font-medium` padding/typography; develop keeps it |
| `AutoCompleteInput.vue` | Branch uses `bg-popover`/`text-popover-foreground` theming; develop uses `bg-inverse-surface`/`text-inverse-on-surface` |
| `EditUploadWidget.vue` | Branch simplifies the save debounce (removes `hasPendingSave` guard + `handleAllComplete`); develop uses more complex save orchestration |
| `EditWidgetLayout.vue` | Minor grid column sizing difference (`[auto,1fr]` vs `[14rem,1fr]`) |
| `AuthDropDown.vue` | Branch removes CSS class hooks (`auth-drop-down__remote-login`, `auth-drop-down__local-login`) |
| `SignInRequiredNotice.vue` | Branch removes CSS class hooks (`sign-in-required__local-login`, `sign-in-required__remote-login`) |

**The most significant differences:**

1. **`Button.vue`**: The `tertiary` variant in develop explicitly sets `p-2 text-xs uppercase font-medium`, which means tertiary buttons are sized/styled like an icon button. The branch removes this, leaving tertiary buttons unstyled. Whether this is "better" depends on where tertiary buttons are used — worth a quick visual check.

2. **`EditUploadWidget.vue`**: The branch's simpler debounce (`useDebounceFn(() => emit('save'), 500, { maxWait: 2000 })`) was superseded by a more complex version that was then further tweaked in PR #463 ("increase save debounce time"). The current develop version is intentional.

3. **AutoComplete theming**: `bg-inverse-surface` in develop seems like a potential theming bug (it uses a very high-contrast surface color for the autocomplete dropdown). The branch's `bg-popover` might be more correct.

**Recommendation:** Review the `AutoCompleteInput.vue` theming change — `bg-inverse-surface` for the autocomplete popover looks suspicious and may be a real visual bug. The rest of the differences are either intentional (Button padding, EditUploadWidget save logic) or cosmetic (CSS class hooks).

> **Tell Copilot:**
> _"Check whether the `AutoCompleteInput` popover background color in develop (`bg-inverse-surface` / `text-inverse-on-surface`) is correct for all themes, or whether it should use `bg-popover` / `text-popover-foreground` as suggested in the `copilot/sub-pr-449` branch. If it's a theming bug, fix it in develop. The branch `copilot/sub-pr-449` can then be deleted."_

---

## Recommended Task Order for Copilot

1. **Delete stale branches** (`feature/fix-typo`, `b3e3b90`) — no analysis needed, just cleanup
2. **Apply the 1-line sidecar fix** (`feature/fix-gap-when-no-sidecars-in-edit-widget-view`) — smallest possible fix
3. **Check the AutoComplete theming** from `copilot/sub-pr-449`
4. **Rebase and PR the child-collection formatting** (`feature/fix-child-collection-formatting-on-all-collections-page`)
5. **Rebase and re-scope the custom script handling** (`feature/custom-script-handling`) — most complex; do last
