import { createAssetsTable } from "./assets";
import { createCollectionsTable } from "./collections";
import { createDrawersTable } from "./drawers";
import { createFilesTable } from "./files";
import { createInstancesTable } from "./instances";
import { createPagesTable } from "./pages";
import { createSessionsTable } from "./sessions";
import { createTemplatesTable } from "./templates";
import { createUsersTable } from "./users";
import { createSearchesTable } from "./searches";
import { createUploadsTable } from "./uploads";

const makeDb = () => {
  const collections = createCollectionsTable();
  const templates = createTemplatesTable();
  const assets = createAssetsTable({ collections, templates });
  const tables = {
    collections,
    templates,
    assets,
    searches: createSearchesTable({ assets, collections, templates }),
    users: createUsersTable(),
    sessions: createSessionsTable(),
    instances: createInstancesTable(),
    pages: createPagesTable(),
    files: createFilesTable(),
    drawers: createDrawersTable(),
    uploads: createUploadsTable(),
  };

  // Seed all the db tables
  Object.values(tables).forEach((table) => {
    if (typeof table.seed === "function") {
      table.seed();
    }
  });

  return tables;
};

// Default database instance
export const db = makeDb();

export type DB = typeof db;

// Worker-specific database instances
const databases = new Map<string, DB>();

export function getOrCreateWorkerDb(workerId: string): DB {
  if (databases.has(workerId)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return databases.get(workerId)!;
  }

  const workerDb = makeDb();

  databases.set(workerId, workerDb);
  return workerDb;
}
