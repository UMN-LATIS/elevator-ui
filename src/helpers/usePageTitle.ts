import { useTitle } from "@vueuse/core";
import { useInstanceStore } from "@/stores/instanceStore";
import { ref, computed } from "vue";

/**
 * a wrapper to set the page title
 * with the instance name appended
 */
export const usePageTitle = (initialPageTitle = "") => {
  const instanceStore = useInstanceStore();
  // the name of the page without the instance name
  // return this to the user so that they can set
  // the title without needing to append the instance name
  // every time
  const pageTitle = ref(initialPageTitle);
  const title = computed(() =>
    pageTitle.value
      ? `${pageTitle.value} | ${instanceStore.instance.name}`
      : instanceStore.instance.name
  );

  useTitle(title);
  return pageTitle;
};
