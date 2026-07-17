import { Hono } from "hono";
import type { Context } from "hono";
import { delay } from "../utils/index";
import type {
  MockDrawerGrant,
  MockDrawerGroup,
  MockServerContext,
  MockUser,
} from "../types";
import type { DB } from "../db/index";
import { findPermissionLevel } from "../db/permissionLevels";

// Mock of the real DrawerPermissions controller: group and grant
// management scoped to the drawers the signed-in user can manage.
const app = new Hono<MockServerContext>();

const USER_TYPE = "User";

// Mirrors GroupTypeCatalog: the built-in types plus one auth-helper type
// ("Unit") so the entries UI has a type to exercise.
const GROUP_TYPES = [
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

const AUTH_HELPER_TYPES = GROUP_TYPES.filter(
  (details) =>
    !["All", "Authed", "Authed_remote", USER_TYPE].includes(details.type)
).map((details) => details.type);

// People the directory knows but who have no local account yet, for the
// autocomplete's provision-a-remote-user path.
const DIRECTORY_ONLY_MATCHES = [
  {
    name: "Directory Dana",
    email: "dana007@example.edu",
    localUserId: null,
    username: "dana007",
  },
];

function isAdmin(user: MockUser): boolean {
  return user.isInstanceAdmin || user.isSuperAdmin;
}

// Admins manage every drawer; everyone else manages the drawers they
// own, the mock's stand-in for the real per-drawer permission map.
function getManageableDrawers(db: DB, user: MockUser) {
  return isAdmin(user) ? db.drawers.getAll() : db.drawers.getByUserId(user.id);
}

function canManageDrawer(db: DB, user: MockUser, drawerId: number): boolean {
  return getManageableDrawers(db, user).some(
    (drawer) => drawer.id === drawerId
  );
}

function grantPayload(db: DB, grant: MockDrawerGrant, currentUser: MockUser) {
  const group = db.drawerGroups.get(grant.groupId) ?? null;
  const owner = group ? db.users.get(group.userId) : undefined;

  return {
    id: grant.id,
    drawerId: grant.drawerId,
    permissionLevelId: grant.permissionLevelId,
    group: group
      ? {
          id: group.id,
          label: group.label,
          type: group.type,
          ownedByCurrentUser: group.userId === currentUser.id,
          ownerName: owner?.displayName ?? null,
          entries_count: group.entries.length,
        }
      : null,
  };
}

function groupPayload(group: MockDrawerGroup) {
  return {
    id: group.id,
    type: group.type,
    label: group.label,
    entries_count: group.entries.length,
    is_personal: false,
  };
}

function memberPayload(user: MockUser) {
  return {
    userId: user.id,
    name: user.displayName,
    email: user.email ?? "",
    username: user.username,
    userType: user.userType ?? "Local",
    createdAt: user.createdAt ?? null,
  };
}

// The auth middleware guarantees a user on every route, so a missing one
// here is a programming error rather than a request error.
function requireUser(c: Context<MockServerContext>): MockUser {
  const user = c.get("user");
  if (!user) {
    throw new Error("requireUser called outside the auth middleware");
  }
  return user;
}

function findOwnGroup(
  db: DB,
  user: MockUser,
  groupId: number
): MockDrawerGroup | undefined {
  const group = db.drawerGroups.get(groupId);
  return group?.userId === user.id ? group : undefined;
}

// every route requires a signed-in user who can manage at least one drawer
app.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Not Authenticated" }, 401);
  }

  const canManageDrawers =
    isAdmin(user) || Boolean(user.permissions.canCreateDrawers);
  if (!canManageDrawers) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
});

// GET /drawerPermissions/groupTypes
app.get("/groupTypes", async (c) => {
  await delay(100);
  return c.json({ groupTypes: GROUP_TYPES });
});

// GET /drawerPermissions/userAutocomplete?q=...
app.get("/userAutocomplete", async (c) => {
  await delay(100);
  const db = c.get("db");
  const query = (c.req.query("q") ?? "").trim().toLowerCase();

  if (query.length < 2) {
    return c.json({ matches: [] });
  }

  const matchesQuery = (...fields: (string | undefined)[]): boolean =>
    fields.some((field) => field?.toLowerCase().includes(query));

  const localMatches = db.users
    .filter((user) => matchesQuery(user.displayName, user.username, user.email))
    .map((user) => ({
      name: user.displayName,
      email: user.email ?? "",
      localUserId: user.id,
      username: user.username,
    }));

  const directoryMatches = DIRECTORY_ONLY_MATCHES.filter((person) =>
    matchesQuery(person.name, person.username, person.email)
  );

  return c.json({ matches: [...localMatches, ...directoryMatches] });
});

// GET /drawerPermissions/manageableDrawers
app.get("/manageableDrawers", async (c) => {
  await delay(100);
  const db = c.get("db");
  const user = requireUser(c);

  const manageableDrawers = getManageableDrawers(db, user)
    .map((drawer) => ({ id: drawer.id, title: drawer.name }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return c.json({ manageableDrawers });
});

// GET /drawerPermissions/grants
app.get("/grants", async (c) => {
  await delay(100);
  const db = c.get("db");
  const user = requireUser(c);

  const grants = db.drawerGrants
    .filter((grant) => canManageDrawer(db, user, grant.drawerId))
    .map((grant) => grantPayload(db, grant, user));

  return c.json({ grants });
});

// POST /drawerPermissions/grants
app.post("/grants", async (c) => {
  await delay(150);
  const db = c.get("db");
  const user = requireUser(c);
  const body = await c.req.parseBody();

  const drawerId = Number(body.drawerId);
  const drawerGroupId = Number(body.drawerGroupId);
  const permissionLevelId = Number(body.permissionLevelId);

  const drawer = db.drawers.get(drawerId);
  if (!drawer) {
    return c.json({ error: "Drawer not found" }, 404);
  }
  if (!canManageDrawer(db, user, drawerId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // sharing is limited to the caller's own groups
  const group = findOwnGroup(db, user, drawerGroupId);
  if (!group) {
    return c.json({ error: "Group not found" }, 422);
  }

  if (!findPermissionLevel(permissionLevelId)) {
    return c.json({ error: "Permission level not found" }, 422);
  }

  const existing = db.drawerGrants.findByDrawerAndGroup(drawerId, group.id);
  if (existing) {
    return c.json(
      {
        error: "Group already has a grant on this drawer",
        existingGrantId: existing.id,
      },
      409
    );
  }

  const grant = db.drawerGrants.create({
    drawerId,
    groupId: group.id,
    permissionLevelId,
  });

  return c.json({ grant: grantPayload(db, grant, user) }, 201);
});

// PUT|PATCH /drawerPermissions/grants/:grantId, re-level only. Drawer
// manage access is the whole gate, so another owner's grant is editable.
app.on(["PUT", "PATCH"], "/grants/:grantId", async (c) => {
  await delay(150);
  const db = c.get("db");
  const user = requireUser(c);

  const grant = db.drawerGrants.get(Number(c.req.param("grantId")));
  if (!grant) {
    return c.json({ error: "Grant not found" }, 404);
  }
  if (!canManageDrawer(db, user, grant.drawerId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await c.req.parseBody();
  const permissionLevelId = Number(body.permissionLevelId);
  if (!findPermissionLevel(permissionLevelId)) {
    return c.json({ error: "Permission level not found" }, 422);
  }

  grant.permissionLevelId = permissionLevelId;

  return c.json({ grant: grantPayload(db, grant, user) });
});

// DELETE /drawerPermissions/grants/:grantId. Unlike update, a manager can
// only delete grants on their own groups; admins can delete any.
app.delete("/grants/:grantId", async (c) => {
  await delay(150);
  const db = c.get("db");
  const user = requireUser(c);

  const grant = db.drawerGrants.get(Number(c.req.param("grantId")));
  if (!grant) {
    return c.json({ error: "Grant not found" }, 404);
  }
  if (!canManageDrawer(db, user, grant.drawerId)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const group = db.drawerGroups.get(grant.groupId);
  const isAnotherOwnersGrant = group !== undefined && group.userId !== user.id;
  if (isAnotherOwnersGrant && !isAdmin(user)) {
    return c.json({ error: "Cannot delete another owner's grant" }, 403);
  }

  db.drawerGrants.delete(grant.id);

  return c.json({ removed: grant.id });
});

// GET /drawerPermissions/groups: the caller's own groups
app.get("/groups", async (c) => {
  await delay(100);
  const db = c.get("db");
  const user = requireUser(c);

  const groups = db.drawerGroups.getByUserId(user.id).map(groupPayload);

  return c.json({ groups });
});

// POST /drawerPermissions/groups
app.post("/groups", async (c) => {
  await delay(150);
  const db = c.get("db");
  const user = requireUser(c);
  const body = await c.req.parseBody();

  const label = String(body.label ?? "").trim();
  const type = String(body.type ?? "");

  const typeDetails = GROUP_TYPES.find((details) => details.type === type);
  if (label === "" || !typeDetails) {
    return c.json({ errors: { label: ["Label and type are required"] } }, 422);
  }
  if (typeDetails.adminOnly && !isAdmin(user)) {
    return c.json(
      { error: "Only instance admins can use instance-wide group types" },
      403
    );
  }

  const group = db.drawerGroups.create({ userId: user.id, type, label });

  return c.json({ group: groupPayload(group) }, 201);
});

// PUT|PATCH /drawerPermissions/groups/:groupId: rename only, the type is
// fixed at creation
app.on(["PUT", "PATCH"], "/groups/:groupId", async (c) => {
  await delay(150);
  const db = c.get("db");
  const user = requireUser(c);

  const group = findOwnGroup(db, user, Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  const body = await c.req.parseBody();
  const label = String(body.label ?? "").trim();
  if (label === "") {
    return c.json({ errors: { label: ["Label is required"] } }, 422);
  }

  group.label = label;

  return c.json({ group: groupPayload(group) });
});

// DELETE /drawerPermissions/groups/:groupId
app.delete("/groups/:groupId", async (c) => {
  await delay(150);
  const db = c.get("db");
  const user = requireUser(c);

  const group = findOwnGroup(db, user, Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  db.drawerGrants.removeByGroupId(group.id);
  db.drawerGroups.delete(group.id);

  return c.json({ deleted: group.id });
});

// GET /drawerPermissions/groups/:groupId/members
app.get("/groups/:groupId/members", async (c) => {
  await delay(100);
  const db = c.get("db");
  const user = requireUser(c);

  const group = findOwnGroup(db, user, Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  // only User groups hold user ids; other types have no members
  if (group.type !== USER_TYPE) {
    return c.json({ members: [] });
  }

  const members = group.entries
    .flatMap((entry) => {
      const member = db.users.get(Number(entry.value));
      return member ? [memberPayload(member)] : [];
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return c.json({ members });
});

// POST /drawerPermissions/groups/:groupId/members: exactly one of
// localUserId (an existing user) or remoteUserId (a username to provision)
app.post("/groups/:groupId/members", async (c) => {
  await delay(150);
  const db = c.get("db");
  const user = requireUser(c);

  const group = findOwnGroup(db, user, Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }
  if (group.type !== USER_TYPE) {
    return c.json({ error: "Only Specific People groups take members" }, 422);
  }

  const body = await c.req.parseBody();
  const localUserId = String(body.localUserId ?? "");
  const remoteUserId = String(body.remoteUserId ?? "").trim();
  if ((localUserId !== "") === (remoteUserId !== "")) {
    return c.json(
      { error: "Provide exactly one of localUserId or remoteUserId" },
      422
    );
  }

  let member: MockUser | undefined;
  if (localUserId !== "") {
    member = db.users.get(Number(localUserId));
    if (!member) {
      return c.json({ error: "User not found" }, 422);
    }
  } else {
    // not local yet: provision a Remote user from the typed username
    const directoryPerson = DIRECTORY_ONLY_MATCHES.find(
      (person) => person.username === remoteUserId
    );
    member =
      db.users.getByUsername(remoteUserId) ??
      db.users.create({
        displayName: directoryPerson?.name ?? remoteUserId,
        username: remoteUserId,
        password: "",
        isInstanceAdmin: false,
        isSuperAdmin: false,
        email: directoryPerson?.email ?? "",
        userType: "Remote",
        permissions: { canSearchAndBrowse: true },
      });
  }

  const memberId = member.id;
  const isAlreadyMember = group.entries.some(
    (entry) => Number(entry.value) === memberId
  );
  if (isAlreadyMember) {
    return c.json({ error: "User is already a member" }, 409);
  }

  db.drawerGroups.addEntry(group, String(memberId));

  return c.json({ member: memberPayload(member) }, 201);
});

// DELETE /drawerPermissions/groups/:groupId/members/:userId
app.delete("/groups/:groupId/members/:userId", async (c) => {
  await delay(150);
  const db = c.get("db");
  const user = requireUser(c);

  const group = findOwnGroup(db, user, Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }
  if (group.type !== USER_TYPE) {
    return c.json({ error: "Only Specific People groups take members" }, 422);
  }

  const memberId = Number(c.req.param("userId"));
  const entry = group.entries.find(
    (candidate) => Number(candidate.value) === memberId
  );
  if (!entry) {
    return c.json({ error: "User is not a member" }, 404);
  }

  db.drawerGroups.removeEntry(group, entry.id);

  return c.json({ removed: memberId });
});

// GET /drawerPermissions/groups/:groupId/entries
app.get("/groups/:groupId/entries", async (c) => {
  await delay(100);
  const db = c.get("db");
  const user = requireUser(c);

  const group = findOwnGroup(db, user, Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }
  if (!AUTH_HELPER_TYPES.includes(group.type)) {
    return c.json({ error: "Only auth-helper group types take entries" }, 422);
  }

  return c.json({ entries: group.entries });
});

// POST /drawerPermissions/groups/:groupId/entries
app.post("/groups/:groupId/entries", async (c) => {
  await delay(150);
  const db = c.get("db");
  const user = requireUser(c);

  const group = findOwnGroup(db, user, Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }
  if (!AUTH_HELPER_TYPES.includes(group.type)) {
    return c.json({ error: "Only auth-helper group types take entries" }, 422);
  }

  const body = await c.req.parseBody();
  const value = String(body.value ?? "");
  if (value === "" || value.length > 255) {
    return c.json({ errors: { value: ["Value is required"] } }, 422);
  }

  const entry = db.drawerGroups.addEntry(group, value);

  return c.json({ entry }, 201);
});

// PUT|PATCH /drawerPermissions/groups/:groupId/entries/:entryId
app.on(["PUT", "PATCH"], "/groups/:groupId/entries/:entryId", async (c) => {
  await delay(150);
  const db = c.get("db");
  const user = requireUser(c);

  const group = findOwnGroup(db, user, Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  const entry = group.entries.find(
    (candidate) => candidate.id === Number(c.req.param("entryId"))
  );
  if (!entry) {
    return c.json({ error: "Entry not found" }, 404);
  }

  const body = await c.req.parseBody();
  const value = String(body.value ?? "");
  if (value === "" || value.length > 255) {
    return c.json({ errors: { value: ["Value is required"] } }, 422);
  }

  entry.value = value;

  return c.json({ entry });
});

// DELETE /drawerPermissions/groups/:groupId/entries/:entryId
app.delete("/groups/:groupId/entries/:entryId", async (c) => {
  await delay(150);
  const db = c.get("db");
  const user = requireUser(c);

  const group = findOwnGroup(db, user, Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  const entryId = Number(c.req.param("entryId"));
  const entry = group.entries.find((candidate) => candidate.id === entryId);
  if (!entry) {
    return c.json({ error: "Entry not found" }, 404);
  }

  db.drawerGroups.removeEntry(group, entry.id);

  return c.json({ removed: entryId });
});

export default app;
