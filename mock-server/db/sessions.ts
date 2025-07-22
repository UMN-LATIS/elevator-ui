import { MockSession, MockUser } from "../types";

const sessionStore = new Map<MockSession["id"], MockSession>();

export const sessions = {
  create: (userId: MockUser["id"]): MockSession => {
    const sessionId = crypto.randomUUID();
    const session: MockSession = { id: sessionId, userId };
    sessionStore.set(sessionId, session);
    return session;
  },
  delete: (sessionId: MockSession["id"]): void => {
    sessionStore.delete(sessionId);
  },
  get: (sessionId: MockSession["id"]): MockSession | undefined => {
    return sessionStore.get(sessionId);
  },
};
