import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import api from "@/api";

export function usePreviewImagesQuery(fileIds: Ref<string[]>) {
  const hasFiles = computed(() => fileIds.value.length > 0);

  const POLLING_INTERVAL = 4000;
  return useQuery({
    queryKey: ["previewImages"],
    queryFn: () => api.checkPreviewImages(fileIds.value),
    enabled: hasFiles,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    staleTime: POLLING_INTERVAL,
    retry: 3,
    // Retry with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
