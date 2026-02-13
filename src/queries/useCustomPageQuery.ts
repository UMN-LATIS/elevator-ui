import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { MaybeRefOrGetter, toValue } from "vue";
import {
  fetchCustomPage,
  saveCustomPage,
  deleteCustomPage,
} from "@/api/fetchers";
import { CUSTOM_PAGES_QUERY_KEY, INSTANCE_QUERY_KEY } from "./queryKeys";
import type { SaveCustomPageParams } from "@/types";

export function useCustomPageQuery(
  pageIdRef: MaybeRefOrGetter<number | null>,
  options = {}
) {
  return useQuery({
    queryKey: ["customPage", pageIdRef],
    queryFn: () => {
      const pageId = toValue(pageIdRef);
      return pageId ? fetchCustomPage(pageId) : null;
    },
    ...options,
  });
}

export function useSaveCustomPageMutation(options?: {
  onSuccess?: (
    data: { pageId: number },
    variables: SaveCustomPageParams
  ) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveCustomPageParams) => saveCustomPage(params),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOM_PAGES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [INSTANCE_QUERY_KEY] });
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: ["customPage", variables.id],
        });
      }
      options?.onSuccess?.(data, variables);
    },
  });
}

export function useDeleteCustomPageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageId: number) => deleteCustomPage(pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOM_PAGES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [INSTANCE_QUERY_KEY] });
    },
  });
}
