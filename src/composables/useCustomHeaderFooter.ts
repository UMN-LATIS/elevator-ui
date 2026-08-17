import { removeScriptsFromHtml } from "@/helpers/customScriptHelpers";
import { useInstanceNavQuery } from "@/queries/useInstanceNavQuery";
import { ShowCustomHeaderMode } from "@/types";
import { computed } from "vue";

export function useCustomHeaderFooter() {
  const { data: instanceNav } = useInstanceNavQuery();

  const customHeaderMode = computed((): ShowCustomHeaderMode => {
    return instanceNav.value?.customHeaderMode ?? ShowCustomHeaderMode.NEVER;
  });

  const customHeaderText = computed((): string => {
    const rawCustomHeaderText = instanceNav.value?.customHeaderText ?? "";
    return removeScriptsFromHtml(rawCustomHeaderText) ?? "";
  });

  const customFooterText = computed((): string => {
    const rawCustomFooterText = instanceNav.value?.customFooterText ?? "";
    return removeScriptsFromHtml(rawCustomFooterText) ?? "";
  });

  return {
    customHeaderMode,
    customHeaderText,
    customFooterText,
  };
}
