import { type InjectionKey, inject, provide } from "vue";

// Keep this Symbol in this file. Vue runs `<script setup>` once per component
// instance, so a Symbol created inside a component differs between parent and
// child, and inject stops finding the provide.
const ANCESTOR_ASSET_IDS_KEY: InjectionKey<ReadonlySet<string>> =
  Symbol("ancestorAssetIds");

const NO_ANCESTOR_ASSET_IDS: ReadonlySet<string> = new Set();

// Repeats are caught by identity, so MAX_NESTING_DEPTH only bounds chains
// where every asset is different.
const MAX_NESTING_DEPTH = 10;

/** The assets rendering above this widget, empty at the top of the page. */
export function useAncestorAssetIds(): ReadonlySet<string> {
  return inject(ANCESTOR_ASSET_IDS_KEY, NO_ANCESTOR_ASSET_IDS);
}

/** Shares the assets open here with every widget nested below this one. */
export function provideAncestorAssetIds(
  openAssetIds: ReadonlySet<string>
): void {
  provide(ANCESTOR_ASSET_IDS_KEY, openAssetIds);
}

export function canNestAsset(
  openAssetIds: ReadonlySet<string>,
  targetAssetId: string
): boolean {
  return (
    !openAssetIds.has(targetAssetId) && openAssetIds.size < MAX_NESTING_DEPTH
  );
}
