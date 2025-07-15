import { useQuery } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { toValue, type MaybeRefOrGetter } from "vue";
import { FILE_METADATA_QUERY_KEY } from "./queryKeys";

export function useFileMetadataQuery(fileId: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: [FILE_METADATA_QUERY_KEY, toValue(fileId)],
    queryFn: () => fetchers.fetchFileMetaData(toValue(fileId)),
  });
}
