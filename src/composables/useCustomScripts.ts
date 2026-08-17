import {
  executeScripts,
  getScriptsFromHTML,
} from "@/helpers/customScriptHelpers";
import { useInstanceNavQuery } from "@/queries/useInstanceNavQuery";
import { computed, watch } from "vue";

/**
 * Runs the `<script>` tags embedded in the instance's custom header
 * and footer HTML. Scripts run once per app load, after the first
 * instanceNav response that contains any — re-running them on every
 * refetch would re-register whatever they set up.
 */
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

  let hasExecutedCustomScripts = false;

  watch(
    customScripts,
    (scripts) => {
      if (hasExecutedCustomScripts || !scripts.length) return;
      executeScripts(scripts);
      hasExecutedCustomScripts = true;
    },
    { immediate: true }
  );
}
