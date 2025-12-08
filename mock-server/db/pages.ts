import { Page } from "../../src/types";
import { MockPage } from "../types";
import { createBaseTable } from "./baseTable";

const pageSeeds: MockPage[] = [
  {
    id: 1,
    title: "Home Page",
    content: `<h1>Elevator Home Page</h1>
      <p>Welcome to the Elevator mock server!</p>
      <img src="https://upload.wikimedia.org/wikipedia/commons/5/59/Goldy_the_Gopher.jpg" alt="Goldy the Gopher" width="300" />
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Goldy_Gopher_Volleyball.jpg/500px-Goldy_Gopher_Volleyball.jpg" alt="Goldy Gopher snowboarding down a staircase at a women's volleyball game" width="300" />
    `,
  },
  {
    id: 2,
    title: "About",
    includeInNav: true,
    content: `
    <h1>About Elevator</h1>
    <p>Learn more about us</p>
    <img src="https://upload.wikimedia.org/wikipedia/commons/5/59/Goldy_the_Gopher.jpg" alt="Goldy the Gopher" width="300" />
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Goldy_Gopher_Volleyball.jpg/500px-Goldy_Gopher_Volleyball.jpg" alt="Goldy Gopher snowboarding down a staircase at a women's volleyball game" width="300" />
    `,
  },
];

function toPageWithoutContent(page: MockPage): Page {
  return {
    id: page.id,
    title: page.title,
    includeInNav: page.includeInNav,
    children: page.children?.map(toPageWithoutContent) ?? ([] as Page[]),
  };
}

export function createPagesTable() {
  const baseTable = createBaseTable((page: MockPage) => page.id, pageSeeds);

  return {
    ...baseTable,
    // Table-specific methods
    getAllWithoutContent: (): Page[] => {
      return baseTable.getAll().map(toPageWithoutContent);
    },
  };
}

export type PagesTable = ReturnType<typeof createPagesTable>;
