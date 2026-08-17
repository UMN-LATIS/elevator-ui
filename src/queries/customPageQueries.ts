import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { MaybeRefOrGetter, toValue } from "vue";
import {
  fetchCustomPageForEditing,
  fetchAllCustomPages as fetchAllCustomPages,
  saveCustomPage,
  deleteCustomPage,
  fetchPageView,
} from "@/api/fetchers";
import {
  CUSTOM_PAGES,
  EDIT,
  INSTANCENAV_QUERY_KEY,
  LIST,
  VIEW,
} from "./queryKeys";
import type { SaveCustomPageParams } from "@/types";

export function useAllCustomPagesQuery() {
  return useQuery({
    queryKey: [CUSTOM_PAGES, LIST],
    queryFn: fetchAllCustomPages,
  });
}

export function useCustomPageEditQuery(
  pageIdRef: MaybeRefOrGetter<number | null>,
  options = {}
) {
  return useQuery({
    queryKey: [CUSTOM_PAGES, pageIdRef, EDIT],
    queryFn: () => {
      const pageId = toValue(pageIdRef);
      return pageId ? fetchCustomPageForEditing(pageId) : null;
    },
    ...options,
  });
}

export function useCustomPageViewQuery(
  pageIdRef: MaybeRefOrGetter<number | null>,
  options = {}
) {
  return useQuery({
    queryKey: [CUSTOM_PAGES, pageIdRef, VIEW],
    queryFn: () => {
      const pageId = toValue(pageIdRef);
      return pageId ? fetchPageView(pageId) : null;
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
      queryClient.invalidateQueries({
        queryKey: [CUSTOM_PAGES, LIST],
      });

      queryClient.invalidateQueries({
        queryKey: [CUSTOM_PAGES, variables.id],
      });

      // instance nav has the list of menu pages
      queryClient.invalidateQueries({ queryKey: [INSTANCENAV_QUERY_KEY] });

      options?.onSuccess?.(data, variables);
    },
  });
}

export function useDeleteCustomPageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageId: number) => deleteCustomPage(pageId),
    onSuccess: (data, pageId) => {
      queryClient.invalidateQueries({
        queryKey: [CUSTOM_PAGES, LIST],
      });

      queryClient.invalidateQueries({
        queryKey: [CUSTOM_PAGES, pageId],
      });

      // instance nav has the list of menu pages
      queryClient.invalidateQueries({ queryKey: [INSTANCENAV_QUERY_KEY] });
    },
  });
}
