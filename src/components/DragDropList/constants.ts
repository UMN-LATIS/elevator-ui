import type { InjectionKey } from "vue";

export const GROUP_ID_PROVIDE_KEY = Symbol() as InjectionKey<string | number>;

// for branding drag data
export const DRAG_DATA_KEY = Symbol("dragData");
export const DROP_DATA_KEY = Symbol("dropData");
