import { queryOptions } from "@tanstack/vue-query";
import { toValue, type MaybeRefOrGetter } from "vue";
import * as fetchers from "@/api/fetchers";
import { FILE_DOWNLOADS_QUERY_KEY } from "./queryKeys";

export function fileDownloadsQuery(
  fileObjectId: MaybeRefOrGetter<string | null>,
  parentObjectId: MaybeRefOrGetter<string | null> = null
) {
  return queryOptions({
    queryKey: [FILE_DOWNLOADS_QUERY_KEY, fileObjectId, parentObjectId],
    queryFn: async () => {
      const id = toValue(fileObjectId);
      if (!id) return null;
      return fetchers.fetchFileDownloadInfo(id, toValue(parentObjectId));
    },
    refetchOnWindowFocus: false,
  });
}
