import { useMutation, useQueryClient } from "@tanstack/vue-query";
import api from "@/api";
import { resetAllStores } from "@/stores/resetAllStores";
import { useDrawerStore } from "@/stores/drawerStore";

export function useLoginAsGuestMutation() {
  const queryClient = useQueryClient();
  const drawerStore = useDrawerStore();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const result = await api.loginAsGuest(credentials);
      if (result.status === "error") {
        throw new Error(result.message);
      }
      return result;
    },
    onSuccess: () => {
      api.clearCache();
      resetAllStores();

      // Re-init drawerStore here, not in a mutate() callback:
      // resetAllStores clears drawerStore.isReady, which
      // drops App.vue's RouterView gate and unmounts the
      // login page. Then TanStack skips callbacks for an
      // unmounted component.
      drawerStore.init();

      queryClient.resetQueries();
    },
  });
}
