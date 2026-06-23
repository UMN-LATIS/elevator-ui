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

// One suggestion from the user-autocomplete endpoint. `completionId` is
// the local user id when the person already has a row; it is null for a
// directory-only match (someone central auth knows but who has never
// logged in here), in which case `username` is what provisioning keys on.
export interface UserAutocompleteMatch {
  name: string;
  email: string;
  completionId: number | null;
  username: string;
}

// `values` is only meaningful for "User"-type groups; the backend
// resolves each entry (user id or internet ID) to a user on submit.
export interface CreateGroupPayload {
  type: GroupTypeValues;
  label: string;
  values?: string[];
}

