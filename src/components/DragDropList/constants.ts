import type * as T from "@/types";
import { useAssetEditor } from "@/pages/CreateOrEditAssetPage/useAssetEditor/useAssetEditor";
import type { InjectionKey } from "vue";

export const GROUP_ID_PROVIDE_KEY = Symbol() as InjectionKey<string | number>;
export const ASSET_EDITOR_PROVIDE_KEY = Symbol() as InjectionKey<
  ReturnType<typeof useAssetEditor>
>;

// for branding drag data
export const DRAG_DATA_KEY = Symbol("dragData");
export const DROP_DATA_KEY = Symbol("dropData");
