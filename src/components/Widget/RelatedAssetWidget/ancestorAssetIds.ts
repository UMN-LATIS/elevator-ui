import type { InjectionKey } from "vue";

/**
 * The assets a related-asset widget is rendering inside of.
 *
 * A related asset can link back to an asset already open above it, so each
 * widget adds its own asset to the set before providing it to its children.
 * A widget that finds its asset already in the set has hit a cycle.
 *
 * The key has to live in a module: `<script setup>` runs per component
 * instance, so a Symbol declared there would never match between parent and
 * child.
 */
export const ANCESTOR_ASSET_IDS_KEY: InjectionKey<Set<string>> =
  Symbol("ancestorAssetIds");
