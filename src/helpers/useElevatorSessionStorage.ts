import { useSessionStorage } from "@vueuse/core";
import { ElevatorPluginType, ElevatorCallbackType } from "@/types";

export function useElevatorSessionStorage() {
  const returnUrl = useSessionStorage<string | null>("returnURL", null);
  const elevatorPlugin = useSessionStorage<ElevatorPluginType | null>(
    "elevatorPlugin",
    null
  );
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
    elevatorPlugin,
    elevatorCallbackType,
    clear,
  };
}
