import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { toValue, type MaybeRefOrGetter } from "vue";
import { INSTANCE_QUERY_KEY, TEMPLATES_QUERY_KEY } from "./queryKeys";
import type { TemplateSummary, AdminTemplate, TemplatePayload } from "@/types";
import { useInstanceStore } from "@/stores/instanceStore";

export function useTemplateQuery(
  templateId: MaybeRefOrGetter<string | number | null>,
  options = {}
) {
  return useQuery({
    queryKey: [TEMPLATES_QUERY_KEY, templateId],
    enabled: () => !!toValue(templateId),
    initialData: () => null,
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
    queryKey: [TEMPLATES_QUERY_KEY],
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
    onSuccess: () => {
      // invalidate template list
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });

      // invalidate instanceNav data too since it contains template info
      queryClient.invalidateQueries({ queryKey: [INSTANCE_QUERY_KEY] });
      const instanceStore = useInstanceStore();
      instanceStore.refresh();
    },
  });
}

export function useAdminTemplateQuery(
  templateId: MaybeRefOrGetter<number | null>,
  options = {}
) {
  return useQuery<AdminTemplate>({
    queryKey: [TEMPLATES_QUERY_KEY, "admin", templateId] as const,
    enabled: () => toValue(templateId) !== null,
    queryFn: () => fetchers.fetchAdminTemplate(toValue(templateId)!),
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useCreateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TemplatePayload) => fetchers.createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [INSTANCE_QUERY_KEY] });
      const instanceStore = useInstanceStore();
      instanceStore.refresh();
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
      // Invalidate both the admin detail cache and the summary list
      queryClient.invalidateQueries({
        queryKey: [TEMPLATES_QUERY_KEY, "admin", templateId],
      });
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [INSTANCE_QUERY_KEY] });
      const instanceStore = useInstanceStore();
      instanceStore.refresh();
    },
  });
}
