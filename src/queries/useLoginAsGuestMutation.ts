import { useMutation, useQueryClient } from "@tanstack/vue-query";
import api from "@/api";
import { resetAllStores } from "@/stores/resetAllStores";

export function useLoginAsGuestMutation() {
  const queryClient = useQueryClient();

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
      queryClient.resetQueries();
    },
  });
}
