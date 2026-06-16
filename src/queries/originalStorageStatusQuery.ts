import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import * as fetchers from "@/api/fetchers";
import { ORIGINAL_STORAGE_STATUS_QUERY_KEY } from "./queryKeys";

const RESTORE_POLL_INTERVAL_MS = 30_000;

export function originalStorageStatusQuery(
  fileObjectId: MaybeRefOrGetter<string | null>
) {
  return queryOptions({
    queryKey: [ORIGINAL_STORAGE_STATUS_QUERY_KEY, fileObjectId],
    queryFn: async () => {
      const id = toValue(fileObjectId);
      if (!id) return null;
      return fetchers.fetchOriginalFileStorageStatus(id);
    },
    // Poll only while a restore is in flight.
    refetchInterval: (query) =>
      query.state.data?.status === "restoring"
        ? RESTORE_POLL_INTERVAL_MS
        : false,
    refetchOnWindowFocus: false,
  });
}
