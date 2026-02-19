import { watchEffect } from "vue";
import { useInstanceStore } from "@/stores/instanceStore";

const STYLE_TAG_ID = "elevator-custom-css";

export function useCustomCSS() {
  const instanceStore = useInstanceStore();

  watchEffect(() => {
    const shouldApply =
      instanceStore.useCustomCSS && instanceStore.customHeaderCSS;

    const existing = document.getElementById(STYLE_TAG_ID);

    if (!shouldApply) {
      existing?.remove();
      return;
    }

    const styleTag = existing ?? document.createElement("style");
    styleTag.id = STYLE_TAG_ID;
    styleTag.textContent = instanceStore.customHeaderCSS;

    if (!existing) {
      document.head.appendChild(styleTag);
    }
  });
}
