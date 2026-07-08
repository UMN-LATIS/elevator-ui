export const GROUP_TYPES = {
  ALL: "All",
  AUTHED: "Authed",
  REMOTE: "Authed_remote", // SSO
  USER: "User",
} as const;

type GroupTypeKeys = keyof typeof GROUP_TYPES;

export type GroupTypeValues = (typeof GROUP_TYPES)[GroupTypeKeys];

// A suggested entry value for an auth-helper group type, from the signed-in
// admin's own session data (e.g. courses they teach). Often legitimately
// empty: local admins and some types (JobCode) have no hints.
export interface EntryHint {
  value: string;
  label: string;
}

export interface GroupTypeDetails {
  type: GroupTypeValues;
  label: string;
  description: string;
  entryHints: EntryHint[];
}

// One raw match value of a value-based group: an auth attribute string
// the group matches on. User groups store resolved user ids here and
// manage them through the members endpoints instead.
export interface PermissionsGroupEntry {
  id: number;
  value: string;
}

export interface PermissionsGroup {
  id: number;
  type: GroupTypeValues;
  label: string;
  entries_count: number;
}

// Auth-helper types are defined per campus by the backend's AuthHelper
// classes, so the UI can only recognize them as "not one of the built-in
// GROUP_TYPES". The backend rejects entry writes on other types anyway.
export function isAuthHelperGroupType(group: PermissionsGroup): boolean {
  const builtInTypes: GroupTypeValues[] = Object.values(GROUP_TYPES);
  return !builtInTypes.includes(group.type);
}

// A group with something to manage inside: User groups manage members,
// auth-helper groups manage match values. Global types match everyone
// and hold nothing.
export function isManageableGroup(group: PermissionsGroup): boolean {
  return group.type === GROUP_TYPES.USER || isAuthHelperGroupType(group);
}

// The numeric permission tiers, mirroring the API's PERM_* constants in
// application/config/constants.php (same names, so they grep across both
// repos). The API also defines aliases DERIVATIVES_GROUP_1 (20) and
// ORIGINALSWITHOUTDERIVATIVES (25), omitted here.
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

export type PermLevelNumber = (typeof PERM)[keyof typeof PERM];

// A permission tier from GET /adminPermissions/permissionLevels. `level` is
// the numeric strength (a PERM value) that access checks compare; grants
// reference tiers by `id`.
export interface PermissionLevel {
  id: number;
  level: number;
  name: string;
  label: string;
}

// A stored grant row from GET /adminPermissions/instanceGrants: the group
// holds the level on every collection in the instance. The id fields are
// null on orphaned legacy rows whose group or level was deleted.
export interface InstanceGrant {
  id: number;
  groupId: number | null;
  permissionLevelId: number | null;
}

// A stored grant row from GET /adminPermissions/collectionGrants: the group
// holds the level on one collection and its descendants.
export interface CollectionGrant {
  id: number;
  collectionId: number | null;
  groupId: number | null;
  permissionLevelId: number | null;
}

// A user-autocomplete suggestion. `localUserId` is the local user id, or
// null for someone the directory knows but who has no local row yet.
export interface UserAutocompleteMatch {
  name: string;
  email: string;
  localUserId: number | null;
  username: string;
}

// A member of a User group, resolved to display data so the UI can show who
// belongs (the group list itself only carries ids).
export interface GroupMember {
  userId: number;
  name: string;
  email: string;
  username: string;
  // "Local" or "Remote" — a Remote member may be a stub that has never
  // signed in.
  userType: string;
  // ISO 8601, or null. When the user account was created.
  createdAt: string | null;
}

// `values` holds "User"-group members. Always sent, even when empty for a
// group with no members yet. The backend sets group_value itself.
export interface CreateGroupPayload {
  type: GroupTypeValues;
  label: string;
  values: string[];
}

// Edit a group's label and type. Members are not edited here. Changing the
// type clears existing members server-side.
export interface UpdateGroupPayload {
  type: GroupTypeValues;
  label: string;
}
