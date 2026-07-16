import { queryOptions } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { makeQueryKeysFor } from "@/helpers/makeQueryKeysFor";

const drawerGrantKeys = makeQueryKeysFor("drawerGrants");

export function drawerGrantsQuery() {
  return queryOptions({
    queryKey: drawerGrantKeys.list(),
    queryFn: fetchers.fetchDrawerGrants,
  });
}
