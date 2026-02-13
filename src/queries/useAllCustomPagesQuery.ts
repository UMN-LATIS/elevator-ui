import { useQuery } from "@tanstack/vue-query";
import { fetchCustomPages } from "@/api/fetchers";
import { CustomPageSummary } from "@/types";
import { CUSTOM_PAGES_QUERY_KEY } from "./queryKeys";

export function useAllCustomPagesQuery() {
  return useQuery({
    queryKey: [CUSTOM_PAGES_QUERY_KEY],
    queryFn: fetchCustomPages,
    initialData: () => [] as CustomPageSummary[],
  });
}
