import { watchEffect } from "vue";
import { useInstanceNavQuery } from "@/queries/useInstanceNavQuery";

const STYLE_TAG_ID = "elevator-custom-css";

export function useCustomCSS() {
  const { data: instanceNav } = useInstanceNavQuery();

  watchEffect(() => {
    const isUsingCustomCSS = instanceNav.value?.useCustomCSS ?? false;

    const customHeaderCSS = instanceNav.value?.customHeaderCSS ?? "";

    const hasCustomCSS = !!customHeaderCSS;

    const shouldApply = isUsingCustomCSS && hasCustomCSS;

    const existing = document.getElementById(STYLE_TAG_ID);

    if (!shouldApply) {
      existing?.remove();
      return;
    }

    const styleTag = existing ?? document.createElement("style");
    styleTag.id = STYLE_TAG_ID;
    styleTag.textContent = customHeaderCSS;

    if (!existing) {
      document.head.appendChild(styleTag);
    }
  });
}
