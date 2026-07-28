// One catalog serves /adminPermissions/groupTypes and
// /drawerPermissions/groupTypes, so the two surfaces cannot drift.
export const USER_TYPE = "User";

export const GROUP_TYPES = [
  {
    type: "All",
    label: "All",
    description: "Everyone, including signed-out visitors.",
    entryHints: [],
    adminOnly: true,
  },
  {
    type: "Authed",
    label: "Authenticated Users",
    description: "Anyone signed in, by any login method.",
    entryHints: [],
    adminOnly: true,
  },
  {
    type: "Authed_remote",
    label: "Centrally Authenticated Users",
    description: "Users signed in through central single sign-on (SSO).",
    entryHints: [],
    adminOnly: true,
  },
  {
    type: USER_TYPE,
    label: "Specific People",
    description: "Specific people you choose. Add by name, email, or username.",
    entryHints: [],
    adminOnly: false,
  },
  {
    type: "Unit",
    label: "University Unit",
    description: "Everyone in a university unit.",
    entryHints: [
      { value: "LIBR", label: "University Libraries" },
      { value: "DSGN", label: "College of Design" },
    ],
    adminOnly: false,
  },
];
