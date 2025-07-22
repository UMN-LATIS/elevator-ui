import type { ApiInstanceNavResponse } from "../../src/types/index";

export const instance: ApiInstanceNavResponse = {
  pages: [
    {
      title: "Home Page",
      id: 1,
      children: []
    }
  ],
  userIsloggedIn: true,
  userCanSearchAndBrowse: true,
  userCanCreateDrawers: true,
  userCanManageAssets: true,
  userId: 1,
  userDisplayName: "",
  userIsAdmin: true,
  userIsSuperAdmin: true,
  instanceName: "defaultinstance",
  instanceId: 1,
  instanceHasLogo: false,
  instanceLogo: 1,
  instanceShowCollectionInSearchResults: true,
  instanceShowTemplateInSearchResults: true,
  featuredAssetId: "",
  featuredAssetText: "",
  // Note: recentDrawers and recentCollections are not in the ApiInstanceNavResponse interface
  // They're handled separately in the UI
  sortableFields: {},
  contact: "mailto:mcfa0086@umn.edu",
  useCentralAuth: true,
  centralAuthLabel: "Universty",
  collections: [
    {
      id: 1,
      title: "Default Collection",
      previewImageId: ""
    }
  ],
  templates: { 1: "Some Fields" },
  customHeaderMode: 0,
  customHeader: null,
  customFooter: null,
  useVoyagerViewer: false
};

export default instance;