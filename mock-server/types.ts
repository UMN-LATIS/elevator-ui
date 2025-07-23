import { RawSortableField, ShowCustomHeaderMode } from "../src/types";

export interface MockUser {
  id: number;
  displayName: string;
  username: string;
  password: string;
  isInstanceAdmin: boolean;
  isSuperAdmin: boolean;
  permissions: {
    canManageAssets?: boolean;
    canCreateDrawers?: boolean;
    canSearchAndBrowse?: boolean;
  };
}

export interface MockSession {
  id: string; // unique session identifier
  userId: number;
}

export interface MockInstance {
  id: number;
  name: string;
  hasLogo: boolean;
  logo: number; // ??
  showCollectionInSearchResults: boolean;
  showTemplateInSearchResults: boolean;
  contact: string; // email address
  useCentralAuth: boolean;
  centralAuthLabel: string;
  sortableFields: Record<string, RawSortableField>;
  customHeaderMode: ShowCustomHeaderMode;
  customHeader: string | null; // HTML string
  customFooter: string | null; // HTML string
  useVoyagerViewer: boolean;
  useCustomCSS: boolean;
  featuredAssetId: string | null;
  featuredAssetText: string | null;
}

export interface AssetFormData {
  objectId?: string;
  templateId?: number;
  collectionId?: number;
  [key: string]: unknown;
}

export interface DrawerFormData {
  drawerId?: string;
  name?: string;
  description?: string;
  [key: string]: unknown;
}

export interface FileFormData {
  fileId?: string;
  fileName?: string;
  [key: string]: unknown;
}

export interface MockServerContext {
  Variables: {
    user: MockUser | null;
    session: MockSession | null;
    isAuthenticated: boolean;
    db: typeof import("./db/index.js").db;
  };
}

export interface MockPage {
  id: number;
  title: string;
  content: string;
  children?: MockPage[];
}
