import type { InstanceSettings } from "../types";

/**
 * Default/empty instance settings for form initialization
 */
export function getDefaultInstanceSettings(
  instanceId: number
): InstanceSettings {
  return {
    instanceId,
    name: "",
    domain: "",
    ownerHomepage: null,
    googleAnalyticsKey: null,
    featuredAsset: null,
    featuredAssetText: null,
    amazonS3Key: null,
    amazonS3Secret: null,
    defaultBucket: null,
    bucketRegion: null,
    showCollectionInSearchResults: true,
    showTemplateInSearchResults: false,
    showPreviousNextSearchResults: true,
    hideVideoAudio: false,
    allowIndexing: true,
    useVoyagerViewer: true,
    automaticAltText: true,
    autoloadMaxSearchResults: false,
    useCustomHeader: 0,
    customHeaderText: null,
    customFooterText: null,
    useCustomCSS: false,
    customHeaderCSS: null,
    useHeaderLogo: false,
    enableInterstitial: false,
    interstitialText: null,
    interfaceVersion: 1,
    useCentralAuth: true,
    centralAuthLabel: "University",
    enableHLSStreaming: false,
    enableTheming: false,
    defaultTheme: "light",
    availableThemes: ["light", "dark", "folwell"],
    customHomeRedirect: null,
    maximumMoreLikeThis: null,
    defaultTextTruncationHeight: null,
    notes: null,
    createdAt: null,
    modifiedAt: null,
  };
}
