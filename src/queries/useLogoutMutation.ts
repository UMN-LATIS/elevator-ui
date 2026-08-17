import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { logout } from "@/api/fetchers";
import api from "@/api";
import { resetAllStores } from "@/stores/resetAllStores";

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,

    // onSettled, so that a failed request still clears the caches
    onSettled: () => {
      api.clearCache();
      resetAllStores();
      queryClient.resetQueries();
    },
  });
}
