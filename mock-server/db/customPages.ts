import { MockCustomPage } from "../types";
import { createBaseTable } from "./baseTable";

const now = new Date().toISOString();

const customPageSeeds: MockCustomPage[] = [
  {
    id: 1,
    title: "Home Page",
    body: `
      <h1>Elevator Home Page</h1>
      <p>Welcome to the Elevator mock server!</p>
      <img src="https://upload.wikimedia.org/wikipedia/commons/5/59/Goldy_the_Gopher.jpg" alt="Goldy the Gopher" width="300" />
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Goldy_Gopher_Volleyball.jpg/500px-Goldy_Gopher_Volleyball.jpg" alt="Goldy Gopher snowboarding down a staircase at a women's volleyball game" width="300" />
    `,
    includeInHeader: false,
    parentId: null,
    sortOrder: 0,
    createdAt: now,
    modifiedAt: null,
  },
  {
    id: 2,
    title: "About Elevator",
    body: `
      <p>Learn more about us.</p>
      <img src="https://upload.wikimedia.org/wikipedia/commons/5/59/Goldy_the_Gopher.jpg" alt="Goldy the Gopher" width="300" />
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Goldy_Gopher_Volleyball.jpg/500px-Goldy_Gopher_Volleyball.jpg" alt="Goldy Gopher snowboarding down a staircase at a women's volleyball game" width="300" />
    `,
    includeInHeader: true,
    parentId: null,
    sortOrder: 1,
    createdAt: now,
    modifiedAt: null,
  },
  {
    id: 3,
    title: "Test Page with Broken Images",
    body: `
      <p>This page has a mix of valid and broken images to test error handling.</p>
      <img src="https://upload.wikimedia.org/wikipedia/commons/5/59/Goldy_the_Gopher.jpg" alt="Valid image" width="300" />
      <img src="https://invalid-domain-that-does-not-exist.com/broken-image.jpg" alt="Broken image 1" width="300" />
      <img src="https://example.com/this-image-does-not-exist-404.png" alt="Broken image 2" width="300" />
    `,
    includeInHeader: true,
    parentId: null,
    sortOrder: 2,
    createdAt: now,
    modifiedAt: null,
  },
  {
    id: 4,
    title: "Page with Timeout Test",
    body: `
      <p>This page has an image that takes longer than the timeout to load.</p>
      <img src="https://upload.wikimedia.org/wikipedia/commons/5/59/Goldy_the_Gopher.jpg" alt="Fast loading image" width="300" />
      <img src="http://localhost:3001/_tests/slow-image.jpg" alt="Slow loading image" width="300" />
    `,
    includeInHeader: false,
    parentId: null,
    sortOrder: 3,
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
        modifiedAt: null,
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
