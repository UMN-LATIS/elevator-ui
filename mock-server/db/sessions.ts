import { MockSession, MockUser } from "../types";
import { createBaseTable } from "./baseTable";

function createSessionsTable() {
  const baseTable = createBaseTable(
    (session: MockSession) => session.id,
    [] // Empty seed data - sessions are created dynamically
  );

  return {
    ...baseTable,
    // Table-specific methods
    create: (userId: MockUser["id"]): MockSession => {
      const sessionId = crypto.randomUUID();
      const session: MockSession = { id: sessionId, userId };
      baseTable.set(sessionId, session);
      return session;
    },
  };
}

export const sessions = createSessionsTable();
sessions.seed();
export { createSessionsTable };
