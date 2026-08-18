import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  INSTANCENAV_QUERY_KEY,
  TEMPLATES_QUERY_KEY,
  FIELD_TYPES_QUERY_KEY,
  LIST,
  EDIT,
} from "./queryKeys";
import type {
  TemplateSummary,
  AdminTemplate,
  TemplatePayload,
  FieldType,
} from "@/types";

export function useTemplateQuery(
  templateId: MaybeRefOrGetter<string | number | null>,
  options = {}
) {
  return useQuery({
    queryKey: [TEMPLATES_QUERY_KEY, templateId],
    enabled: () => !!toValue(templateId),
    placeholderData: () => null,
    queryFn: async () => {
      const id = toValue(templateId);
      const idInt = Number.parseInt(id as string);
      return id ? await fetchers.fetchTemplate(idInt) : null;
    },
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useAllTemplatesQuery(options = {}) {
  return useQuery<TemplateSummary[]>({
    queryKey: [TEMPLATES_QUERY_KEY, LIST],
    queryFn: () => fetchers.fetchAllTemplates(),
    // Sort here so components always receive an alphabetically ordered list
    // regardless of what order the API returns them in.
    select: (templates) =>
      templates.toSorted((a, b) => a.name.localeCompare(b.name)),
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useDeleteTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: number) => fetchers.deleteTemplate(templateId),
    onSuccess: (_, templateId) => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY, LIST] });
      queryClient.invalidateQueries({
        queryKey: [TEMPLATES_QUERY_KEY, templateId],
      });

      // invalidate instanceNav data too since it contains template info
      queryClient.invalidateQueries({ queryKey: [INSTANCENAV_QUERY_KEY] });
    },
  });
}

export function useCopyTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: number) => fetchers.copyTemplate(templateId),
    onSuccess: (_, templateId) => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY, LIST] });
      queryClient.invalidateQueries({
        queryKey: [TEMPLATES_QUERY_KEY, templateId],
      });

      // invalidate instanceNav data too since it contains template info
      queryClient.invalidateQueries({ queryKey: [INSTANCENAV_QUERY_KEY] });
    },
  });
}

// Reindex rebuilds search data server-side, so no cached query goes stale.
export function useReindexTemplateMutation() {
  return useMutation({
    mutationFn: (templateId: number) => fetchers.reindexTemplate(templateId),
  });
}

export function useFieldTypesQuery() {
  return useQuery<FieldType[]>({
    queryKey: [FIELD_TYPES_QUERY_KEY],
    queryFn: fetchers.fetchFieldTypes,
    // Field types are static — defined in the DB and never change at runtime.
    staleTime: Infinity,
  });
}

export function useAdminTemplateQuery(
  templateId: MaybeRefOrGetter<number | null>,
  options = {}
) {
  return useQuery<AdminTemplate>({
    queryKey: [TEMPLATES_QUERY_KEY, templateId, EDIT] as const,
    enabled: () => toValue(templateId) !== null,
    queryFn: () => fetchers.fetchAdminTemplate(toValue(templateId)!),
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
}

export function useCreateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TemplatePayload) => fetchers.createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY, LIST] });
      queryClient.invalidateQueries({ queryKey: [INSTANCENAV_QUERY_KEY] });
    },
  });
}

export function useUpdateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      templateId: number;
      payload: TemplatePayload;
    }) => fetchers.updateTemplate(templateId, payload),
    onSuccess: (_data, { templateId }) => {
      queryClient.invalidateQueries({
        queryKey: [TEMPLATES_QUERY_KEY, templateId],
      });
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY, LIST] });
      queryClient.invalidateQueries({ queryKey: [INSTANCENAV_QUERY_KEY] });
    },
  });
}
