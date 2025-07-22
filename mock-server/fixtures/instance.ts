import type { ApiInstanceNavResponse } from "../../src/types/index";
import pages from "./pages";

export const instanceUnauthed: ApiInstanceNavResponse = {
  pages: pages.map((page) => ({
    id: page.id as number,
    title: page.title,
    children: [],
  })),

  userIsloggedIn: false,
  userCanSearchAndBrowse: false,
  userCanCreateDrawers: false,
  userCanManageAssets: false,
  userId: null,
  userDisplayName: null,
  userIsAdmin: false,
  userIsSuperAdmin: false,
  instanceName: "defaultinstance",
  instanceId: 1,
  instanceHasLogo: false,
  instanceLogo: 1,
  instanceShowCollectionInSearchResults: true,
  instanceShowTemplateInSearchResults: true,
  featuredAssetId: "",
  featuredAssetText: "",
  sortableFields: {},
  contact: "mailto:admin@example.com",
  useCentralAuth: true,
  centralAuthLabel: "Universty",
  collections: [],
  templates: [],
  customHeaderMode: 0,
  useCustomCSS: false,
  useVoyagerViewer: false,
};

export const instanceAuthed: ApiInstanceNavResponse = {
  ...instanceUnauthed,
  userIsloggedIn: true,
  userCanSearchAndBrowse: true,
  userCanCreateDrawers: true,
  userCanManageAssets: true,
  userId: 1,
  userDisplayName: "Test User",
  userIsAdmin: true,
  userIsSuperAdmin: true,
  instanceShowCollectionInSearchResults: true,
  instanceShowTemplateInSearchResults: true,
  collections: [
    {
      id: 1,
      title: "Default Collection",
      previewImageId: "",
    },
  ],
  templates: ["Some Fields"],
};
