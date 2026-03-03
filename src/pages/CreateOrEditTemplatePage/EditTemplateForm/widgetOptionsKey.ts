import type { InjectionKey, Ref } from "vue";

export const WIDGET_OPTIONS_KEY: InjectionKey<
  Ref<{ open: boolean; trigger: number }>
> = Symbol("widgetOptions");
