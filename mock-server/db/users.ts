import { MockUser, MockSession } from "../types";
import { sessions } from "./sessions";

const userSeeds = [
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

const userStore = new Map<MockUser["id"], MockUser>(
  userSeeds.map((user) => [user.id, user])
);

export const users = {
  get: (userId: MockUser["id"]): MockUser | undefined => {
    return userStore.get(userId);
  },
  getByUsername: (username: string): MockUser | undefined => {
    return Array.from(userStore.values()).find(
      (user) => user.username === username
    );
  },
  getBySessionId: (sessionId: MockSession["id"]): MockUser | undefined => {
    const session = sessions.get(sessionId);
    if (session) {
      return userStore.get(session.userId);
    }
    return undefined;
  },
};
