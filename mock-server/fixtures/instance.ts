export interface Page {
  title: string;
  id: number;
  includeInNav: boolean;
  children: unknown[];
}

export interface CollectionInfo {
  id: number;
  title: string;
  previewImageId?: string;
}

export interface InstanceNav {
  pages: Page[];
  userIsloggedIn: boolean;
  userCanSearchAndBrowse: boolean;
  userCanCreateDrawers: boolean;
  userCanManageAssets: boolean;
  userId: number;
  userDisplayName: string;
  userIsAdmin: boolean;
  userIsSuperAdmin: boolean;
  instanceName: string;
  instanceId: number;
  instanceHasLogo: boolean;
  instanceLogo: number;
  instanceShowCollectionInSearchResults: boolean;
  instanceShowTemplateInSearchResults: boolean;
  featuredAssetId: string;
  featuredAssetText: string;
  recentDrawers: unknown[];
  recentCollections: CollectionInfo[];
  sortableFields: unknown[];
  contact: string;
  useCentralAuth: boolean;
  centralAuthLabel: string;
  showPreviousNext: boolean;
  collections: CollectionInfo[];
  templates: (unknown[] | string)[];
  customHeaderMode: number;
  useCustomCSS: boolean;
  useVoyagerViewer: boolean;
}

export const instance: InstanceNav = {
  pages: [
    {
      title: "Home Page",
      id: 1,
      includeInNav: false,
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
  recentDrawers: [],
  recentCollections: [
    {
      id: 1,
      title: "Default Collection"
    }
  ],
  sortableFields: [],
  contact: "mailto:mcfa0086@umn.edu",
  useCentralAuth: true,
  centralAuthLabel: "Universty",
  showPreviousNext: true,
  collections: [
    {
      id: 1,
      title: "Default Collection",
      previewImageId: ""
    }
  ],
  templates: [[], "Some Fields"],
  customHeaderMode: 0,
  useCustomCSS: false,
  useVoyagerViewer: false
};

export default instance;