import type { PermissionsGroupEntry } from "../src/types";

export interface MockUser {
  id: number;
  displayName: string;
  username: string;
  password: string;
  isInstanceAdmin: boolean;
  isSuperAdmin: boolean;
  email?: string;
  // Remote marks a user provisioned from the directory rather than
  // created locally
  userType?: "Local" | "Remote";
  permissions: {
    canManageAssets?: boolean;
    canCreateDrawers?: boolean;
    canSearchAndBrowse?: boolean;
  };
}

export interface MockDrawerGroup {
  id: number;
  userId: number;
  type: string;
  label: string;
  entries: PermissionsGroupEntry[];
}

// One group's permission level on one drawer (the backend's DrawerPermission)
export interface MockDrawerGrant {
  id: number;
  drawerId: number;
  groupId: number;
  permissionLevelId: number;
}

export interface MockSession {
  id: string; // unique session identifier
  userId: number;
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

export interface MockCustomPage {
  id: number;
  title: string;
  body: string;
  includeInHeader: boolean;
  parentId: number | null;
  sortOrder: number | null;
  createdAt: string;
  modifiedAt: string | null;
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

type S3StorageStatus =
  // regular S3, non-glacier. Downloadable
  | { storageClass: "STANDARD" }
  // in Glacier. must be restored to download
  | { storageClass: "GLACIER" | "GLACIER_IR" }
  // restore in progress. NOT downloadable
  | { storageClass: "GLACIER" | "GLACIER_IR"; ongoingRequest: true }
  // restored. Will go back to glacier at date. Downloadable.
  | {
      storageClass: "GLACIER" | "GLACIER_IR";
      ongoingRequest: false;
      expiryDate: string;
    };

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
  s3StorageStatus?: S3StorageStatus;
}
