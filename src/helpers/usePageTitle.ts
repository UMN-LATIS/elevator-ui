import { useTitle } from "@vueuse/core";
import { useElevatorInstance } from "@/composables/useElevatorInstance";
import { ref, computed } from "vue";

/**
 * a wrapper to set the page title
 * with the instance name appended
 */
export const usePageTitle = (initialPageTitle = "") => {
  const { instance } = useElevatorInstance();
  // the name of the page without the instance name
  // return this to the user so that they can set
  // the title without needing to append the instance name
  // every time
  const pageTitle = ref(initialPageTitle);
  const title = computed(() => {
    const instanceName = instance.value?.name ?? "Elevator";
    return pageTitle.value
      ? `${pageTitle.value} | ${instanceName}`
      : instanceName;
  });

  useTitle(title);
  return pageTitle;
};
