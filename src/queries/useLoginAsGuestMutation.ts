import { useMutation, useQueryClient } from "@tanstack/vue-query";
import api from "@/api";

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
      // Refetch everything under the new session rather than clearing it,
      // so that useTheming and useCustomCSS, which stay mounted across
      // navigation, stop showing the previous user's settings.
      // Not awaited, so that the login finishes before the refetches do.
      // Otherwise the submit button stays disabled until the last one returns.
      queryClient.resetQueries();
    },
  });
}
