import { type InjectionKey, inject, provide } from "vue";

// Declare the key at module scope. Vue runs `<script setup>` per instance, so
// a Symbol created in a component differs between parent and child and inject
// never matches the provide.
const ANCESTOR_ASSET_IDS_KEY: InjectionKey<ReadonlySet<string>> =
  Symbol("ancestorAssetIds");

const NO_ANCESTOR_ASSET_IDS: ReadonlySet<string> = new Set();

// A repeated asset already stops nesting, so this cap only limits chains of
// all-different assets.
const MAX_NESTING_DEPTH = 10;

export function useAncestorAssetIds(): ReadonlySet<string> {
  return inject(ANCESTOR_ASSET_IDS_KEY, NO_ANCESTOR_ASSET_IDS);
}

export function provideAncestorAssetIds(
  ancestorAssetIds: ReadonlySet<string>
): void {
  provide(ANCESTOR_ASSET_IDS_KEY, ancestorAssetIds);
}

export function canNestAsset(
  ancestorAssetIds: ReadonlySet<string>,
  targetAssetId: string
): boolean {
  return (
    !ancestorAssetIds.has(targetAssetId) &&
    ancestorAssetIds.size < MAX_NESTING_DEPTH
  );
}
