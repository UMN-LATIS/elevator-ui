export const PERMISSIONS_GROUP_TYPES = {
  ALL: "All",
  AUTHED: "Authed",
  SSO: "Authed_remote", // SSO
  USER: "User",
} as const;

type PermissionsGroupTypeKeys = keyof typeof PERMISSIONS_GROUP_TYPES;

export type PermissionsGroupTypeValues =
  (typeof PERMISSIONS_GROUP_TYPES)[PermissionsGroupTypeKeys];

export interface PermissionsGroupType {
  type: PermissionsGroupTypeValues;
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
  type: PermissionsGroupTypeValues;
  // Vestigial scalar: 1 for global types (All/Authed/Authed_remote),
  // null for User groups (whose membership lives in `values`).
  value: number | null;
  label: string;
  expiration: string | null;
  values: PermissionsGroupValue[];
}

// `values` is only meaningful for "User"-type groups; the backend
// resolves each entry (user id or internet ID) to a user on submit.
export interface CreateGroupPayload {
  type: PermissionsGroupTypeValues;
  label: string;
  values?: string[];
}

// A match from the user autocompleter, for adding "User"-group members.
export interface GroupUserMatch {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  source: "local" | "central";
}

// A member chosen in the create-group form, before submission.
// `groupValue` is the username or internet ID sent to the backend;
// `label` is what we show in the chip.
export interface GroupMemberDraft {
  groupValue: string;
  label: string;
}
