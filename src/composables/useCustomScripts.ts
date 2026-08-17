import {
  executeScripts,
  getScriptsFromHTML,
} from "@/helpers/customScriptHelpers";
import { useInstanceNavQuery } from "@/queries/useInstanceNavQuery";
import { computed, ref, watch } from "vue";

export function useCustomScripts() {
  const { data: instanceNav } = useInstanceNavQuery();

  const customScripts = computed((): HTMLScriptElement[] => {
    const headerScripts = getScriptsFromHTML(
      instanceNav.value?.customHeaderText
    );
    const footerScripts = getScriptsFromHTML(
      instanceNav.value?.customFooterText
    );
    return [...headerScripts, ...footerScripts];
  });

  const hasExecutedCustomScripts = ref(false);

  watch(
    customScripts,
    (scripts) => {
      executeScripts(scripts);
      hasExecutedCustomScripts.value = true;
    },
    { once: true }
  );
}
