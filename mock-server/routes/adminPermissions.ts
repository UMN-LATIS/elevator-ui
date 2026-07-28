import { Hono } from "hono";
import { delay } from "../utils/index";
import type { MockAdminGroup, MockServerContext, MockUser } from "../types";
import { findPermissionLevel } from "../db/permissionLevels";
import { GROUP_TYPES, USER_TYPE } from "../db/groupTypes";
import { DIRECTORY_ONLY_MATCHES } from "../db/directoryPeople";
import { isAuthHelperGroupType } from "../../src/types";

const app = new Hono<MockServerContext>();

function toGroupPayload(group: MockAdminGroup) {
  return {
    id: group.id,
    type: group.type,
    label: group.label,
    entries_count: group.entries.length,
    is_personal: false,
  };
}

function toMemberPayload(user: MockUser) {
  return {
    userId: user.id,
    name: user.displayName,
    email: user.email ?? "",
    username: user.username,
    userType: user.userType ?? "Local",
    createdAt: null,
  };
}

// every route requires a signed-in instance admin
app.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Not Authenticated" }, 401);
  }
  if (!user.isInstanceAdmin && !user.isSuperAdmin) {
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
});

app.get("/groupTypes", async (c) => {
  await delay(100);
  return c.json({ groupTypes: GROUP_TYPES });
});

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

app.get("/instanceGrants", async (c) => {
  await delay(100);
  const db = c.get("db");

  return c.json({ instanceGrants: db.instanceGrants.getAll() });
});

app.post("/instanceGrants", async (c) => {
  await delay(150);
  const db = c.get("db");
  const body = await c.req.parseBody();

  const groupId = Number(body.groupId);
  const permissionLevelId = Number(body.permissionLevelId);

  if (!db.adminGroups.get(groupId)) {
    return c.json({ error: "Group not found" }, 422);
  }
  if (!findPermissionLevel(permissionLevelId)) {
    return c.json({ error: "Permission level not found" }, 422);
  }

  const existing = db.instanceGrants.findByGroupId(groupId);
  if (existing) {
    return c.json(
      {
        error: "Group already has an instance grant",
        existingGrantId: existing.id,
      },
      409
    );
  }

  const grant = db.instanceGrants.create({ groupId, permissionLevelId });

  return c.json({ instanceGrant: grant }, 201);
});

// PUT replaces the whole grant, so the group id is writable too.
app.put("/instanceGrants/:grantId", async (c) => {
  await delay(150);
  const db = c.get("db");

  const grant = db.instanceGrants.get(Number(c.req.param("grantId")));
  if (!grant) {
    return c.json({ error: "Grant not found" }, 404);
  }

  const body = await c.req.parseBody();
  const groupId = Number(body.groupId);
  const permissionLevelId = Number(body.permissionLevelId);

  if (!db.adminGroups.get(groupId)) {
    return c.json({ error: "Group not found" }, 422);
  }
  if (!findPermissionLevel(permissionLevelId)) {
    return c.json({ error: "Permission level not found" }, 422);
  }

  grant.groupId = groupId;
  grant.permissionLevelId = permissionLevelId;

  return c.json({ instanceGrant: grant });
});

app.delete("/instanceGrants/:grantId", async (c) => {
  await delay(150);
  const db = c.get("db");

  const grant = db.instanceGrants.get(Number(c.req.param("grantId")));
  if (!grant) {
    return c.json({ error: "Grant not found" }, 404);
  }

  db.instanceGrants.delete(grant.id);

  return c.json({ removed: grant.id });
});

app.get("/collectionGrants", async (c) => {
  await delay(100);
  const db = c.get("db");

  return c.json({ collectionGrants: db.collectionGrants.getAll() });
});

// Collection ids come from the nav's nested tree, which the mock does
// not re-walk, so collectionId is taken as sent.
app.post("/collectionGrants", async (c) => {
  await delay(150);
  const db = c.get("db");
  const body = await c.req.parseBody();

  const collectionId = Number(body.collectionId);
  const groupId = Number(body.groupId);
  const permissionLevelId = Number(body.permissionLevelId);

  if (!Number.isInteger(collectionId) || collectionId <= 0) {
    return c.json({ error: "Collection not found" }, 422);
  }
  if (!db.adminGroups.get(groupId)) {
    return c.json({ error: "Group not found" }, 422);
  }
  if (!findPermissionLevel(permissionLevelId)) {
    return c.json({ error: "Permission level not found" }, 422);
  }

  const existing = db.collectionGrants.findByCollectionAndGroup(
    collectionId,
    groupId
  );
  if (existing) {
    return c.json(
      {
        error: "Group already has a grant on this collection",
        existingGrantId: existing.id,
      },
      409
    );
  }

  const grant = db.collectionGrants.create({
    collectionId,
    groupId,
    permissionLevelId,
  });

  return c.json({ collectionGrant: grant }, 201);
});

// PUT replaces the whole grant, so every id is writable.
app.put("/collectionGrants/:grantId", async (c) => {
  await delay(150);
  const db = c.get("db");

  const grant = db.collectionGrants.get(Number(c.req.param("grantId")));
  if (!grant) {
    return c.json({ error: "Grant not found" }, 404);
  }

  const body = await c.req.parseBody();
  const collectionId = Number(body.collectionId);
  const groupId = Number(body.groupId);
  const permissionLevelId = Number(body.permissionLevelId);

  if (!Number.isInteger(collectionId) || collectionId <= 0) {
    return c.json({ error: "Collection not found" }, 422);
  }
  if (!db.adminGroups.get(groupId)) {
    return c.json({ error: "Group not found" }, 422);
  }
  if (!findPermissionLevel(permissionLevelId)) {
    return c.json({ error: "Permission level not found" }, 422);
  }

  grant.collectionId = collectionId;
  grant.groupId = groupId;
  grant.permissionLevelId = permissionLevelId;

  return c.json({ collectionGrant: grant });
});

app.delete("/collectionGrants/:grantId", async (c) => {
  await delay(150);
  const db = c.get("db");

  const grant = db.collectionGrants.get(Number(c.req.param("grantId")));
  if (!grant) {
    return c.json({ error: "Grant not found" }, 404);
  }

  db.collectionGrants.delete(grant.id);

  return c.json({ removed: grant.id });
});

app.get("/groups", async (c) => {
  await delay(100);
  const db = c.get("db");

  const groups = db.adminGroups.getAll().map(toGroupPayload);

  return c.json({ groups });
});

app.post("/groups", async (c) => {
  await delay(150);
  const db = c.get("db");
  const body = await c.req.parseBody();

  const label = String(body.label ?? "").trim();
  const type = String(body.type ?? "");

  const typeDetails = GROUP_TYPES.find((details) => details.type === type);
  if (label === "" || !typeDetails) {
    return c.json({ errors: { label: ["Label and type are required"] } }, 422);
  }

  const group = db.adminGroups.create({ type, label });

  return c.json({ group: toGroupPayload(group) }, 201);
});

app.put("/groups/:groupId", async (c) => {
  await delay(150);
  const db = c.get("db");

  const group = db.adminGroups.get(Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  const body = await c.req.parseBody();
  const label = String(body.label ?? "").trim();
  const type = String(body.type ?? "");

  const typeDetails = GROUP_TYPES.find((details) => details.type === type);
  if (label === "" || !typeDetails) {
    return c.json({ errors: { label: ["Label and type are required"] } }, 422);
  }

  // a type change invalidates the members the old type held
  if (type !== group.type) {
    group.entries = [];
  }

  group.label = label;
  group.type = type;

  return c.json({ group: toGroupPayload(group) });
});

app.delete("/groups/:groupId", async (c) => {
  await delay(150);
  const db = c.get("db");

  const group = db.adminGroups.get(Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  db.instanceGrants.removeByGroupId(group.id);
  db.collectionGrants.removeByGroupId(group.id);
  db.adminGroups.delete(group.id);

  return c.json({ deleted: group.id });
});

app.get("/groups/:groupId/members", async (c) => {
  await delay(100);
  const db = c.get("db");

  const group = db.adminGroups.get(Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  // only User groups hold user ids, other types have no members
  if (group.type !== USER_TYPE) {
    return c.json({ members: [] });
  }

  const memberUsers = group.entries
    .map((entry) => db.users.get(Number(entry.value)))
    .filter((member): member is MockUser => member !== undefined);
  const members = memberUsers
    .map(toMemberPayload)
    .sort((a, b) => a.name.localeCompare(b.name));

  return c.json({ members });
});

// Takes exactly one of localUserId (an existing user) or
// remoteUserId (a username to provision).
app.post("/groups/:groupId/members", async (c) => {
  await delay(150);
  const db = c.get("db");

  const group = db.adminGroups.get(Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }
  if (group.type !== USER_TYPE) {
    return c.json({ error: "Only Specific People groups take members" }, 422);
  }

  const body = await c.req.parseBody();
  const localUserId = String(body.localUserId ?? "");
  const remoteUserId = String(body.remoteUserId ?? "").trim();
  const hasLocalUserId = localUserId !== "";
  const hasRemoteUserId = remoteUserId !== "";

  // the field name carries the intent, so require exactly one
  if (hasLocalUserId === hasRemoteUserId) {
    return c.json(
      { error: "Provide exactly one of localUserId or remoteUserId" },
      422
    );
  }

  let member: MockUser | undefined;
  if (hasLocalUserId) {
    member = db.users.get(Number(localUserId));
    if (!member) {
      return c.json({ error: "User not found" }, 422);
    }
  } else {
    const existingUser = db.users.getByUsername(remoteUserId);
    if (existingUser) {
      member = existingUser;
    } else {
      // not local yet: provision a Remote user from the typed username
      const directoryPerson = DIRECTORY_ONLY_MATCHES.find(
        (person) => person.username === remoteUserId
      );
      member = db.users.create({
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
  }

  const memberId = member.id;
  const isAlreadyMember = group.entries.some(
    (entry) => Number(entry.value) === memberId
  );
  if (isAlreadyMember) {
    return c.json({ error: "User is already a member" }, 409);
  }

  db.adminGroups.addEntry(group, String(memberId));

  return c.json({ member: toMemberPayload(member) }, 201);
});

app.delete("/groups/:groupId/members/:userId", async (c) => {
  await delay(150);
  const db = c.get("db");

  const group = db.adminGroups.get(Number(c.req.param("groupId")));
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

  db.adminGroups.removeEntry(group, entry.id);

  return c.json({ removed: memberId });
});

app.get("/groups/:groupId/entries", async (c) => {
  await delay(100);
  const db = c.get("db");

  const group = db.adminGroups.get(Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }
  if (!isAuthHelperGroupType(group)) {
    return c.json({ error: "Only auth-helper group types take entries" }, 422);
  }

  return c.json({ entries: group.entries });
});

app.post("/groups/:groupId/entries", async (c) => {
  await delay(150);
  const db = c.get("db");

  const group = db.adminGroups.get(Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }
  if (!isAuthHelperGroupType(group)) {
    return c.json({ error: "Only auth-helper group types take entries" }, 422);
  }

  const body = await c.req.parseBody();
  const value = String(body.value ?? "");
  if (value === "" || value.length > 255) {
    return c.json({ errors: { value: ["Value is required"] } }, 422);
  }

  const entry = db.adminGroups.addEntry(group, value);

  return c.json({ entry }, 201);
});

app.put("/groups/:groupId/entries/:entryId", async (c) => {
  await delay(150);
  const db = c.get("db");

  const group = db.adminGroups.get(Number(c.req.param("groupId")));
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

app.delete("/groups/:groupId/entries/:entryId", async (c) => {
  await delay(150);
  const db = c.get("db");

  const group = db.adminGroups.get(Number(c.req.param("groupId")));
  if (!group) {
    return c.json({ error: "Group not found" }, 404);
  }

  const entryId = Number(c.req.param("entryId"));
  const entry = group.entries.find((candidate) => candidate.id === entryId);
  if (!entry) {
    return c.json({ error: "Entry not found" }, 404);
  }

  db.adminGroups.removeEntry(group, entry.id);

  return c.json({ removed: entryId });
});

export default app;
