import { RawSortableField, ShowCustomHeaderMode } from "../src/types";
import type { StorageClass } from "../src/types/FileDownloadTypes";

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
  pages: MockPage[];
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
  fileObjectId?: string;
  [key: string]: unknown;
}

/**
 * Internal metadata attached to mock objects. Stripped before sending
 * to the client — the frontend never sees this, mirroring how a real
 * backend enforces permissions server-side.
 */
export interface MockMeta {
  visibility: "public" | "authenticated";
}

/** Attach _meta to any mock object type. */
export type WithMeta<T> = T & { _meta?: MockMeta };

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
  includeInNav?: boolean;
  children?: MockPage[];
}

export interface MockDrawer {
  id: number;
  name: string;
  description: string;
  userId: number;
  assetIds: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
  };
  uploadedAt: Date;
  assetId?: string;
  // S3 storage class the backend sees for the original. "GLACIER" makes
  // getOriginal return the restore HTML instead of the file (reproduces #546).
  storageClass?: StorageClass;
}
