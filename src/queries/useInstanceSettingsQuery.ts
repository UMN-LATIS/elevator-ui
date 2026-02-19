import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import * as fetchers from "@/api/fetchers";
import { INSTANCE_SETTINGS_QUERY_KEY, INSTANCE_QUERY_KEY } from "./queryKeys";
import { getDefaultInstanceSettings } from "@/helpers/getDefaultInstanceSettings";
import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";

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

      // refresh instanceStore too
      // this will double-fetch instance info when pages are saved
      // (once for the query invalidation above and once manually here)
      // when we migrate instanceStore consumers to useInstanceQuery, we can
      // remove this manual refresh and rely solely on the query invalidation
      // to update instance info
      const instanceStore = useInstanceStore();
      instanceStore.refresh();
    },
  });
}

export { getDefaultInstanceSettings };
