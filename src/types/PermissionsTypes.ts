export const GROUP_TYPES = {
  ALL: "All",
  AUTHED: "Authed",
  REMOTE: "Authed_remote", // SSO
  USER: "User",
} as const;


type GroupTypeKeys = keyof typeof GROUP_TYPES;

export type GroupTypeValues =
  (typeof GROUP_TYPES)[GroupTypeKeys];

export interface LabelledGroupType {
  type: GroupTypeValues;
  label: string;
  description: string;
}

// A member of a "User"-type group. `value` is the local user id the
// backend resolved the member to; the list response carries no name.
export interface PermissionsGroupValue {
  id: number;
  value: string;
}

export interface PermissionsGroup {
  id: number;
  type: GroupTypeValues;
  // Vestigial scalar: 1 for global types (All/Authed/Authed_remote),
  // null for User groups (whose membership lives in `values`).
  value: number | null;
  label: string;
  expiration: string | null;
  values: PermissionsGroupValue[];
}

// A user-autocomplete suggestion. `completionId` is the local user id, or
// null for someone the directory knows but who has no local row yet.
export interface UserAutocompleteMatch {
  name: string;
  email: string;
  completionId: number | null;
  username: string;
}

// `values` holds "User"-group members. Always sent, even when empty for a
// group with no members yet. The backend sets group_value itself.
export interface CreateGroupPayload {
  type: GroupTypeValues;
  label: string;
  values: string[];
}

