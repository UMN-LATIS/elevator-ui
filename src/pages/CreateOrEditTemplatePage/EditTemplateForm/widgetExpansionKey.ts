import type { InjectionKey } from "vue";

/**
 * Read/write surface a child widget needs to participate in expand/collapse.
 * The owner (EditTemplateForm) keeps the underlying state private and exposes
 * only what consumers should touch.
 */
export interface WidgetExpansion {
  isExpanded: (tempId: string) => boolean;
  setExpanded: (tempId: string, open: boolean) => void;
}

export const WIDGET_EXPANSION_KEY: InjectionKey<WidgetExpansion> =
  Symbol("widgetExpansion");
