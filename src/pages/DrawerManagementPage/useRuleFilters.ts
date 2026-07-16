import { computed } from "vue";
import type { ComputedRef, WritableComputedRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  DEFAULT_GROUP_OWNER,
  parseIdList,
  toGroupOwnerFilter,
  toIdParam,
  type GroupOwnerFilter,
  type RuleFilters,
} from "./ruleFilters";

export interface RuleFilterControls {
  groupOwner: WritableComputedRef<GroupOwnerFilter>;
  drawerIds: WritableComputedRef<number[]>;
  groupIds: WritableComputedRef<number[]>;
  filters: ComputedRef<RuleFilters>;
  isFiltered: ComputedRef<boolean>;
  clear: () => void;
}

/**
 * The Rules tab's filters, held in the URL rather than in component
 * state.
 *
 * The URL is what a link can carry, and a drawer's page links here for
 * its own rules, so the URL is the one place the filters can live
 * without that link needing a way in.
 *
 * `?revealGroup` belongs to the Groups tab, which is why the group
 * filter here is `?group` and the two do not collide when a tab switch
 * carries the query across.
 */
export function useRuleFilters(): RuleFilterControls {
  const route = useRoute();
  const router = useRouter();

  function setQuery(patch: Record<string, string | undefined>): void {
    router.replace({ query: { ...route.query, ...patch } });
  }

  const groupOwner = computed<GroupOwnerFilter>({
    get: () => toGroupOwnerFilter(route.query.owner),
    // the default stays out of the URL, as ?tab does
    set: (value) =>
      setQuery({ owner: value === DEFAULT_GROUP_OWNER ? undefined : value }),
  });

  const drawerIds = computed<number[]>({
    get: () => parseIdList(route.query.drawer),
    set: (ids) => setQuery({ drawer: toIdParam(ids) }),
  });

  const groupIds = computed<number[]>({
    get: () => parseIdList(route.query.group),
    set: (ids) => setQuery({ group: toIdParam(ids) }),
  });

  const filters = computed<RuleFilters>(() => ({
    groupOwner: groupOwner.value,
    drawerIds: drawerIds.value,
    groupIds: groupIds.value,
  }));

  const isFiltered = computed(
    (): boolean =>
      groupOwner.value !== DEFAULT_GROUP_OWNER ||
      drawerIds.value.length > 0 ||
      groupIds.value.length > 0
  );

  function clear(): void {
    setQuery({ owner: undefined, drawer: undefined, group: undefined });
  }

  return { groupOwner, drawerIds, groupIds, filters, isFiltered, clear };
}
