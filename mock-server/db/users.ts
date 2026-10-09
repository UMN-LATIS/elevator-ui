import { MockUser, MockSession } from "../types";
import { createBaseTable } from "./baseTable";
import { sessions } from "./sessions";

const userSeeds: MockUser[] = [
  {
    id: 1,
    displayName: "Admin User",
    username: "admin",
    password: "admin",
    isInstanceAdmin: true,
    isSuperAdmin: true,
    email: "",
    hasExpiry: false,
    expires: "2014-01-24T00:00:00+00:00",
    permissions: {
      canManageAssets: true,
      canCreateDrawers: true,
      canSearchAndBrowse: true,
    },
  },
  {
    id: 2,
    displayName: "Regular User",
    username: "user",
    password: "user",
    isInstanceAdmin: false,
    isSuperAdmin: false,
    permissions: {
      canManageAssets: false,
      canCreateDrawers: false,
      canSearchAndBrowse: true,
    },
  },
  {
    id: 3,
    displayName: "Curator User",
    username: "curator",
    password: "curator",
    isInstanceAdmin: false,
    isSuperAdmin: false,
    permissions: {
      canManageAssets: true,
      canCreateDrawers: true,
      canSearchAndBrowse: true,
    },
  },
  {
    id: 4,
    displayName: "Template Editor",
    username: "templateeditor",
    password: "templateeditor",
    isInstanceAdmin: false,
    isSuperAdmin: false,
    permissions: {
      canManageAssets: false,
      canCreateDrawers: false,
      canSearchAndBrowse: true,
      canEditTemplates: true,
    },
  },
  {
    id: 5,
    displayName: "Instance Admin",
    username: "instanceadmin",
    password: "instanceadmin",
    isInstanceAdmin: true,
    isSuperAdmin: false,
    permissions: {
      canManageAssets: true,
      canCreateDrawers: true,
      canSearchAndBrowse: true,
    },
  },
  {
    id: 6,
    displayName: "Pat Smith",
    username: "smit0123",
    password: "smit0123",
    isInstanceAdmin: false,
    isSuperAdmin: false,
    email: "smit0123@umn.edu",
    emplid: "1234567",
    userType: "Local",
    hasExpiry: true,
    expires: "2099-05-31T12:00:00-05:00",
    createdAt: "2026-08-14T10:02:11-05:00",
    instance: { id: 3, name: "Art History" },
    permissions: { canSearchAndBrowse: true },
  },
  {
    id: 7,
    displayName: "Expired Guest",
    username: "guest0042",
    password: "guest0042",
    isInstanceAdmin: false,
    isSuperAdmin: false,
    email: "guest0042@example.edu",
    userType: "Local",
    hasExpiry: true,
    expires: "2020-01-31T00:00:00-06:00",
    createdAt: "2019-09-03T08:30:00-05:00",
    instance: { id: 1, name: "defaultinstance" },
    permissions: { canSearchAndBrowse: true },
  },
  {
    id: 8,
    displayName: "",
    username: "legacy",
    password: "legacy",
    isInstanceAdmin: false,
    isSuperAdmin: false,
    userType: "Local",
    permissions: { canSearchAndBrowse: true },
  },
  {
    id: 9,
    displayName: "Robin Okafor",
    username: "okaf0007",
    password: "okaf0007",
    isInstanceAdmin: false,
    isSuperAdmin: true,
    email: "okaf0007@umn.edu",
    emplid: "7654321",
    userType: "Remote",
    createdAt: "2025-02-11T14:45:00-06:00",
    permissions: { canSearchAndBrowse: true },
  },
  ...Array.from({ length: 110 }, (_, index) => makeRemoteUser(index + 1)),
];

function makeRemoteUser(sequenceNumber: number): MockUser {
  const paddedNumber = String(sequenceNumber).padStart(3, "0");
  return {
    id: 100 + sequenceNumber,
    displayName: `Remote User ${paddedNumber}`,
    username: `remote${paddedNumber}`,
    password: `remote${paddedNumber}`,
    isInstanceAdmin: false,
    isSuperAdmin: false,
    email: `remote${paddedNumber}@umn.edu`,
    userType: "Remote",
    createdAt: new Date(Date.UTC(2025, 0, sequenceNumber)).toISOString(),
    permissions: { canSearchAndBrowse: true },
  };
}

function createUsersTable() {
  const baseTable = createBaseTable((user: MockUser) => user.id, userSeeds);
  const firstCreatedUserId = Math.max(...userSeeds.map((user) => user.id)) + 1;
  let nextUserId = firstCreatedUserId;

  return {
    ...baseTable,
    // Table-specific methods
    getByUsername: (username: string): MockUser | undefined => {
      return baseTable.find((user) => user.username === username);
    },
    create: (data: Omit<MockUser, "id">): MockUser => {
      const user: MockUser = { id: nextUserId++, ...data };
      baseTable.set(user.id, user);
      return user;
    },
    reset: (): void => {
      baseTable.reset();
      nextUserId = firstCreatedUserId;
    },
    getBySessionId: (sessionId: MockSession["id"]): MockUser | undefined => {
      const session = sessions.get(sessionId);
      if (session) {
        return baseTable.get(session.userId);
      }
      return undefined;
    },
  };
}

export const users = createUsersTable();
users.seed();

export { createUsersTable };
