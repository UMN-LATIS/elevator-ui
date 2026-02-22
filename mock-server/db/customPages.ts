import { MockCustomPage } from "../types";
import { createBaseTable } from "./baseTable";

const now = new Date().toISOString();

const customPageSeeds: MockCustomPage[] = [
  {
    id: 1,
    title: "About Us",
    body: "<h1>About Us</h1><p>Learn more about Elevator.</p>",
    includeInHeader: true,
    parentId: null,
    sortOrder: 0,
    createdAt: now,
    modifiedAt: null,
  },
  {
    id: 2,
    title: "FAQ",
    body: "<h1>Frequently Asked Questions</h1><p>Answers to common questions.</p>",
    includeInHeader: true,
    parentId: null,
    sortOrder: 1,
    createdAt: now,
    modifiedAt: null,
  },
  {
    id: 3,
    title: "FAQ Details",
    body: "<h2>More Details</h2><p>Additional FAQ information.</p>",
    includeInHeader: false,
    parentId: 2,
    sortOrder: 0,
    createdAt: now,
    modifiedAt: null,
  },
  {
    id: 4,
    title: "Contact",
    body: "<h1>Contact Us</h1><p>Get in touch with our team.</p>",
    includeInHeader: false,
    parentId: null,
    sortOrder: 2,
    createdAt: now,
    modifiedAt: null,
  },
];

export function createCustomPagesTable() {
  const baseTable = createBaseTable(
    (page: MockCustomPage) => page.id,
    customPageSeeds
  );
  let nextId = customPageSeeds.length + 1;

  const getParentTitle = (parentId: number | null): string | null => {
    if (parentId === null) return null;
    return baseTable.get(parentId)?.title ?? null;
  };

  return {
    ...baseTable,
    getParentTitle,
    create: (
      data: Pick<
        MockCustomPage,
        "title" | "body" | "includeInHeader" | "parentId" | "sortOrder"
      >
    ): MockCustomPage => {
      const page: MockCustomPage = {
        id: nextId++,
        ...data,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };
      baseTable.set(page.id, page);
      return page;
    },
    update: (
      id: number,
      data: Partial<
        Pick<
          MockCustomPage,
          "title" | "body" | "includeInHeader" | "parentId" | "sortOrder"
        >
      >
    ): MockCustomPage | undefined => {
      const page = baseTable.get(id);
      if (!page) return undefined;

      const updated: MockCustomPage = {
        ...page,
        ...data,
        modifiedAt: new Date().toISOString(),
      };
      baseTable.set(id, updated);
      return updated;
    },
    reset: (): void => {
      baseTable.reset();
      nextId = customPageSeeds.length + 1;
      baseTable.seed();
    },
  };
}

export type CustomPagesTable = ReturnType<typeof createCustomPagesTable>;
