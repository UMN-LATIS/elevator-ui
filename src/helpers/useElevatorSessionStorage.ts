import { computed } from "vue";
import { useSessionStorage } from "@vueuse/core";
import {
  ElevatorPluginType,
  ElevatorCallbackType,
  ElevatorLTIId,
  ElevatorUserID,
  ElevatorLTIVersion,
  ElevatorPluginInitMessageData,
} from "@/types";

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

  const elevatorLTIVersion = useSessionStorage<ElevatorLTIVersion | null>(
    "ltiVersion",
    null
  );
  const elevatorLaunchId = useSessionStorage<ElevatorLTIId | null>(
    "launchId",
    null
  );

  const userId = useSessionStorage<ElevatorUserID | null>("userId", null);

  function clear() {
    returnUrl.value = null;
    elevatorPlugin.value = null;
    elevatorCallbackType.value = null;
  }

  function init(event: MessageEvent<ElevatorPluginInitMessageData>) {
    // if we're already setup, ignore
    if (elevatorPlugin.value) {
      return;
    }

    elevatorPlugin.value = event.data.elevatorPlugin;
    elevatorCallbackType.value = event.data.elevatorCallbackType;
    elevatorLTIVersion.value = event.data.ltiVersion;
    elevatorLaunchId.value = event.data.launchId;
    userId.value = event.data.userId;
  }

  return {
    returnUrl,
    isInEmbedMode,
    elevatorPlugin,
    elevatorCallbackType,
    elevatorLTIVersion,
    elevatorLaunchId,
    userId,
    clear,
    init,
  };
}
