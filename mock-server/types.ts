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
}
