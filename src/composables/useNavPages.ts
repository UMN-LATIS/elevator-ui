import { useInstanceNavQuery } from "@/queries/useInstanceNavQuery";
import { Page } from "@/types";
import { computed } from "vue";

const HOME_PAGE_TITLE = "Home Page";

export function useNavPages() {
  const {
    data: instanceNav,
    isLoading,
    isError,
    isSuccess,
  } = useInstanceNavQuery();

  const navPages = computed((): Page[] => instanceNav.value?.pages ?? []);

  const homePageId = computed(
    (): Page["id"] | null =>
      instanceNav.value?.pages.find((p) => p.title === HOME_PAGE_TITLE)?.id ??
      null
  );

  return {
    navPages,
    homePageId,
    isLoading,
    isError,
    isSuccess,
  };
}
