export const GROUP_TYPES = {
  ALL: "All",
  AUTHED: "Authed",
  REMOTE: "Authed_remote", // SSO
  USER: "User",
} as const;

type GroupTypeKeys = keyof typeof GROUP_TYPES;

export type GroupTypeValues = (typeof GROUP_TYPES)[GroupTypeKeys];

export interface GroupTypeDetails {
  type: GroupTypeValues;
  label: string;
  description: string;
}

// A member of a "User"-type group. `value` is the local user id the
// backend resolved the member to; the list response carries no name.
export interface PermissionsGroupEntry {
  id: number;
  value: string;
}

export interface PermissionsGroup {
  id: number;
  type: GroupTypeValues;
  label: string;
  expiration: string | null;
  entries_count: number;
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
