import type { InjectionKey } from "vue";

// for tracking widget option expansion in the template editor
export interface WidgetExpansion {
  isExpanded: (tempId: string) => boolean;
  setExpanded: (tempId: string, open: boolean) => void;
}

export const WIDGET_EXPANSION_KEY: InjectionKey<WidgetExpansion> =
  Symbol("widgetExpansion");
