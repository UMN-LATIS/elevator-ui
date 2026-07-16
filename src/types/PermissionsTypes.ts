import type { ISODateTime } from ".";

export const GROUP_TYPES = {
  ALL: "All",
  AUTHED: "Authed",
  REMOTE: "Authed_remote", // SSO
  USER: "User",
} as const;

type GroupTypeKeys = keyof typeof GROUP_TYPES;

export type GroupTypeValues = (typeof GROUP_TYPES)[GroupTypeKeys];

export interface EntryHint {
  value: string;
  label: string;
}

// GET /adminPermissions/groupTypes and /drawerPermissions/groupTypes
export interface GroupTypeDetails {
  type: GroupTypeValues;
  label: string;
  description: string;
  entryHints: EntryHint[];
  adminOnly: boolean; // types only usable by admins (`All`, `Authed`, ...)
}

export interface PermissionsGroupEntry {
  id: number;
  value: string;
}

export interface PermissionsGroup {
  id: number;
  type: GroupTypeValues;
  label: string;
  entries_count: number;
  // auto-created personal group
  is_personal?: boolean;
}

// The type predicates below sort groups by type alone, and the two group
// shapes the API returns disagree on everything else.
type TypedGroup = { type: GroupTypeValues };

// Auth-helper types are defined by the backend's AuthHelper
// classes, so the UI can only recognize them as "not one of the built-in
// GROUP_TYPES". The backend rejects entry writes on other types anyway.
export function isAuthHelperGroupType(group: TypedGroup): boolean {
  const builtInTypes: GroupTypeValues[] = Object.values(GROUP_TYPES);
  return !builtInTypes.includes(group.type);
}

// A group with something to manage inside: members, entries
export function isManageableGroup(group: TypedGroup): boolean {
  return group.type === GROUP_TYPES.USER || isAuthHelperGroupType(group);
}

// The numeric permission tiers, mirroring the API's PERM_* constants in
// application/config/constants.php.
export const PERM = {
  NOPERM: 0,
  SEARCH: 10,
  VIEWDERIVATIVES: 20,
  DERIVATIVES_GROUP_2: 25,
  CREATEDRAWERS: 30,
  ORIGINALS: 40,
  ADDASSETS: 50,
  ADMIN: 60,
} as const;

export interface PermissionLevel {
  id: number;
  level: number; // 0, 10, 20, ... see PERM
  name: string;
  label: string;
}

export interface InstanceGrant {
  id: number;
  groupId: number | null;
  permissionLevelId: number | null;
}

export interface CollectionGrant {
  id: number;
  collectionId: number | null;
  groupId: number | null;
  permissionLevelId: number | null;
}

export interface UserAutocompleteMatch {
  name: string;
  email: string;
  // null for someone the directory knows but who has no local row yet.
  localUserId: number | null;
  username: string;
}

export interface GroupMember {
  userId: number;
  name: string;
  email: string;
  username: string;
  userType: "Local" | "Remote";
  createdAt: ISODateTime | null;
}

export interface CreateGroupPayload {
  type: GroupTypeValues;
  label: string;
}

export interface UpdateGroupPayload {
  type: GroupTypeValues;
  label: string;
}

export interface ManageableDrawer {
  id: number;
  title: string | null;
}

// The group a drawer grant reaches. It rides along inline on the grant
// because /drawerPermissions/groups only lists the caller's own groups,
// so another owner's group could not be joined client-side.
export interface DrawerGrantGroup {
  id: number;
  label: string;
  type: GroupTypeValues;
  ownedByCurrentUser: boolean;
  // null for a global group type, which has no owner
  ownerName: string | null;
  // A User group stores its members as entries, so one count covers both.
  entries_count: number;
}

// GET /drawerPermissions/grants: one drawer group's permission level on
// one drawer the caller can manage. drawerId and permissionLevelId join
// against the drawers list and the permission level catalog.
export interface DrawerGrant {
  id: number;
  drawerId: number | null;
  permissionLevelId: number | null;
  group: DrawerGrantGroup | null;
}

// POST /drawerPermissions/grants. The drawer must be one the caller
// manages and the group one they own, so a grant can only be created
// from the caller's own groups even though existing ones stay editable.
export interface CreateDrawerGrantPayload {
  drawerId: number;
  drawerGroupId: number;
  permissionLevelId: number;
}

// PUT /drawerPermissions/grants/{id}. A grant stays on the drawer and the
// group it was created for, so its level is all that changes.
export interface UpdateDrawerGrantPayload {
  permissionLevelId: number;
}
