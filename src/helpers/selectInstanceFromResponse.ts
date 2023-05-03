import { ApiInstanceNavResponse, ElevatorInstance } from "@/types";
import config from "@/config";

export function selectInstanceFromResponse(
  apiResponse: ApiInstanceNavResponse
): ElevatorInstance {
  const {
    instanceName,
    instanceId,
    instanceHasLogo,
    contact,
    useCentralAuth,
    centralAuthLabel,
    featuredAssetId,
    featuredAssetText,
    userCanSearchAndBrowse,
  } = apiResponse;

  const logoImg = instanceHasLogo
    ? {
        // Note: the asset is at the base origin, _not_ the base url
        // ✅ Base Origin: https://dev.elevator.umn.edu
        // ❌ Base Url: https://dev.elevator.umn.edu/dcl
        src: `${config.instance.base.origin}/assets/instanceAssets/${instanceId}.png`,
        alt: `${instanceName} logo`,
      }
    : null;

  return {
    id: instanceId,
    name: instanceName ?? "Elevator",
    logoImg,
    useCentralAuth,
    centralAuthLabel,
    contact: contact,
    featuredAssetId,
    featuredAssetText,
    userCanSearchAndBrowse,
  };
}
