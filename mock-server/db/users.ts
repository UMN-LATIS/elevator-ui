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
];

function createUsersTable() {
  const baseTable = createBaseTable((user: MockUser) => user.id, userSeeds);
  let nextUserId = 100;

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
      nextUserId = 100;
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
