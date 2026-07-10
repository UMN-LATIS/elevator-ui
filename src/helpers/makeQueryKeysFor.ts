/**
 * Query keys for one resource, split into a "list" branch and an "item"
 * branch. Invalidation matches keys by prefix, so the kind comes right
 * after the resource: the list can refresh without refetching every
 * item, and [resource, "item"] targets all items but not the list.
 * See https://tkdodo.eu/blog/effective-react-query-keys
 *
 * @example
 * ```ts
 * const groupKeys = makeQueryKeysFor("drawerGroups");
 * queryClient.invalidateQueries({ queryKey: groupKeys.list() });
 * queryClient.removeQueries({ queryKey: groupKeys.item(deletedId) });
 * ```
 */
export function makeQueryKeysFor<Resource extends string>(resource: Resource) {
  return {
    list: () => [resource, "list"] as const,
    item: (id: number) => [resource, "item", id] as const,
  };
}
