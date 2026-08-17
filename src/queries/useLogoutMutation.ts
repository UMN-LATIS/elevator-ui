import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { logout } from "@/api/fetchers";

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
    },
  });
}
