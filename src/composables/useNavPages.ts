import { useInstanceNavQuery } from "@/queries/useInstanceNavQuery";
import { Page } from "@/types";
import { computed } from "vue";

export function useNavPages() {
  const { data, isLoading, isError, isSuccess } = useInstanceNavQuery();

  const navPages = computed((): Page[] => data.value?.pages ?? []);

  return {
    navPages,
    isLoading,
    isError,
    isSuccess,
  };
}
