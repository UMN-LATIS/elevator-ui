import { computed } from "vue";
import { useSessionStorage } from "@vueuse/core";
import { ElevatorPluginType, ElevatorCallbackType } from "@/types";

export function useElevatorSessionStorage() {
  const returnUrl = useSessionStorage<string | null>("returnURL", null);
  const elevatorPlugin = useSessionStorage<ElevatorPluginType | null>(
    "elevatorPlugin",
    null
  );
  const isInEmbedMode = computed(() => !!elevatorPlugin.value);

  const elevatorCallbackType = useSessionStorage<ElevatorCallbackType | null>(
    "elevatorCallbackType",
    null
  );

  function clear() {
    returnUrl.value = null;
    elevatorPlugin.value = null;
    elevatorCallbackType.value = null;
  }

  return {
    returnUrl,
    isInEmbedMode,
    elevatorPlugin,
    elevatorCallbackType,
    clear,
  };
}
