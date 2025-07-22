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
}
