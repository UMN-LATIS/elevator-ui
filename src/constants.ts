import type { InjectionKey } from "vue";

export const getWidgetNestingDepthProviderKey = Symbol() as InjectionKey<
  () => number
>;
