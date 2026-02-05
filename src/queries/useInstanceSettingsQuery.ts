import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { INSTANCE_SETTINGS_QUERY_KEY, INSTANCE_QUERY_KEY } from "./queryKeys";
import type { InstanceSettings } from "@/types";
import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";

export function useInstanceSettingsQuery(
  instanceId: MaybeRefOrGetter<number | null>
) {
  return useQuery({
    queryKey: [INSTANCE_SETTINGS_QUERY_KEY, instanceId],
    queryFn: () => {
      const id = toValue(instanceId);
      if (!id) {
        throw new Error("Instance ID is required");
      }
      return fetchers.fetchInstanceSettings(id);
    },
    enabled: () => toValue(instanceId) !== null,
    retry: false,
  });
}

export function useUpdateInstanceSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchers.updateInstanceSettings,
    onSuccess: (_data, variables) => {
      // Invalidate instance settings query
      queryClient.invalidateQueries({
        queryKey: [INSTANCE_SETTINGS_QUERY_KEY, variables.instanceId],
      });
      // Also invalidate the main instance query since some settings affect it
      queryClient.invalidateQueries({
        queryKey: [INSTANCE_QUERY_KEY],
      });
    },
  });
}

/**
 * Default/empty instance settings for form initialization
 */
export function getDefaultInstanceSettings(
  instanceId: number
): InstanceSettings {
  return {
    instanceId,
    name: "",
    domain: "",
    ownerHomepage: null,
    googleAnalyticsKey: null,
    featuredAsset: null,
    featuredAssetText: null,
    amazonS3Key: null,
    amazonS3Secret: null,
    defaultBucket: null,
    bucketRegion: null,
    showCollectionInSearchResults: false,
    showTemplateInSearchResults: false,
    showPreviousNextSearchResults: false,
    hideVideoAudio: false,
    allowIndexing: true,
    useVoyagerViewer: false,
    automaticAltText: false,
    autoloadMaxSearchResults: false,
    useCustomHeader: 0,
    customHeaderText: null,
    customFooterText: null,
    useCustomCSS: false,
    customHeaderCSS: null,
    useHeaderLogo: false,
    enableInterstitial: false,
    interstitialText: null,
    interfaceVersion: 1,
    useCentralAuth: false,
    enableHLSStreaming: false,
    enableTheming: false,
    defaultTheme: null,
    availableThemes: null,
    customHomeRedirect: null,
    maximumMoreLikeThis: null,
    defaultTextTruncationHeight: null,
    notes: null,
    createdAt: null,
    modifiedAt: null,
  };
}
