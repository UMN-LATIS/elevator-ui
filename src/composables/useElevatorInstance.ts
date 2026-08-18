import { computed, ref } from "vue";
import { ApiInstanceNavResponse, ElevatorInstance } from "@/types";
import config from "@/config";
import { useInstanceNavQuery } from "@/queries/useInstanceNavQuery";

// Cache-buster appended to the logo URL. The logo lives at a fixed URL,
// so without this a re-uploaded logo would be served from the browser's
// HTTP cache. Starts at app-load time so a logo changed in an earlier
// session shows fresh, and bumps after an upload in this session.
const logoRefreshedAt = ref(Date.now());

export function refreshLogoImage(): void {
  logoRefreshedAt.value = Date.now();
}

function selectInstanceFromResponse(
  apiResponse: ApiInstanceNavResponse
): ElevatorInstance {
  const {
    instanceName,
    instanceId,
    instanceHasLogo,
    instanceShowCollectionInSearchResults,
    instanceShowTemplateInSearchResults,
    contact,
    useCentralAuth,
    centralAuthLabel,
    featuredAssetId,
    featuredAssetText,
    templates,
    useVoyagerViewer,
    showChildCollections,
    showAssetLastModifiedDate,
    showThumbnailDescription,
    theming,
  } = apiResponse;

  const logoImg = instanceHasLogo
    ? {
        // Note: the asset is at the base origin, _not_ the base url
        // ✅ Base Origin: https://dev.elevator.umn.edu
        // ❌ Base Url: https://dev.elevator.umn.edu/dcl
        src: `${config.instance.base.origin}/assets/instanceAssets/${instanceId}.png?t=${logoRefreshedAt.value}`,
        alt: `${instanceName} logo`,
      }
    : null;

  const templatesArray = Object.entries(templates)
    .map(([id, name]) => ({
      id: Number.parseInt(id),
      name,
    }))
    // remove the empty template (has a label of [] for some reason)
    .filter(({ name }) => typeof name === "string")
    // sort by name
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    id: instanceId,
    name: instanceName ?? "Elevator",
    logoImg,
    useCentralAuth,
    centralAuthLabel,
    contact: contact,
    featuredAssetId,
    featuredAssetText,
    templates: templatesArray,
    showCollectionInSearchResults: instanceShowCollectionInSearchResults,
    showTemplateInSearchResults: instanceShowTemplateInSearchResults,
    useVoyagerViewer, // whether or not to use the Voyager viewer
    showChildCollections: showChildCollections ?? true,
    showThumbnailDescription: showThumbnailDescription ?? false,
    showAssetLastModifiedDate: showAssetLastModifiedDate ?? false,
    theming,
  };
}

export function useElevatorInstance() {
  const {
    data: instanceNav,
    isLoading,
    isError,
    isSuccess,
  } = useInstanceNavQuery();

  const instance = computed((): ElevatorInstance | null =>
    instanceNav.value ? selectInstanceFromResponse(instanceNav.value) : null
  );

  return {
    instance,
    isLoading,
    isError,
    isSuccess,
  };
}
